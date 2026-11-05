
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { CLINIC } from '../../lib/clinic.js';
import { clinicDayRange, isValidSlot, slotsForDate } from '../../lib/slots.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { phoneSchema } from '../../lib/phone.js';
import { AppointmentStatus, Prisma, UserRole } from '@prisma/client';
import { requireRole } from '../../middleware/requireRole.js';


const router = Router();

const ACTIVE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

// Accepts 09xxxxxxxx, 07xxxxxxxx, 2519xxxxxxxx, +2519xxxxxxxx; stores as +251XXXXXXXXX
const createSchema = z.object({
  patientName: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  email: z.email().optional(),
  serviceId: z.uuid(),
  // client must send an offset, e.g. 2026-10-12T09:00:00+03:00
  appointmentDate: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
  message: z.string().trim().max(1000).optional(),
});

const checkInSchema = z.object({
  patientId: z.uuid().optional(),
});
const assignDoctorSchema = z.object({
  doctorId: z.string().uuid(),
});
const availabilitySchema = z.object({ date: z.iso.date() });

const listSchema = z.object({
  status: z.enum(AppointmentStatus).optional(),
  date: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const appointmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  status: z.nativeEnum(AppointmentStatus).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  doctorId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),

  search: z.string().trim().max(100).optional(),
});

const statusSchema = z.object({ status: z.enum(AppointmentStatus) });

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'NO_SHOW']),
  reason: z.string().trim().max(500).optional(),
});

const checkInAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10, // keep generous: many users can share one IP on mobile networks
  message: { message: 'Too many booking requests, try again later' },
});


function buildAppointmentWhere(
  filters: z.infer<typeof appointmentListQuerySchema>,
): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00+03:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    where.appointmentDate = {
      gte: start,
      lt: end,
    };
  }

  if (filters.search) {
    where.OR = [
      {
        patientName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: filters.search,
        },
      },
    ];
  }

  return where;
}

router.get('/availability', validateQuery(availabilitySchema), async (_req, res) => {
  const { date } = res.locals.query as z.infer<typeof availabilitySchema>;
  const slots = slotsForDate(date);
  if (slots.length === 0) return res.json({ date, slots: [] });

  const grouped = await prisma.appointment.groupBy({
    by: ['appointmentDate'],
    where: { ...{ appointmentDate: clinicDayRange(date) }, status: { in: ACTIVE } },
    _count: true,
  });
  const counts = new Map(grouped.map((g) => [g.appointmentDate.getTime(), g._count]));
  const earliest = Date.now() + CLINIC.minLeadMinutes * 60_000;

  res.json({
    date,
    slots: slots.map((s) => ({
      time: s.toISOString(),
      available: s.getTime() >= earliest && (counts.get(s.getTime()) ?? 0) < CLINIC.maxPerSlot,
    })),
  });
});

router.post('/', bookingLimiter, validateBody(createSchema), async (_req, res) => {
  const data = res.locals.body as z.infer<typeof createSchema>;
  const t = data.appointmentDate.getTime();
  const now = Date.now();

  if (t < now + CLINIC.minLeadMinutes * 60_000) {
    throw new AppError(400, 'Please choose a later time');
  }
  if (t > now + CLINIC.bookingWindowDays * 24 * 60 * 60_000) {
    throw new AppError(400, `Bookings open up to ${CLINIC.bookingWindowDays} days ahead`);
  }
  if (!isValidSlot(data.appointmentDate)) {
    throw new AppError(400, 'Selected time is outside clinic hours');
  }

const appointment = await prisma.$transaction(
  async (tx) => {
    const service = await tx.service.findFirst({
      where: { id: data.serviceId, isActive: true },
      select: { id: true },
    });

    if (!service) {
      throw new AppError(400, 'Service not available');
    }

    const taken = await tx.appointment.count({
      where: {
        appointmentDate: data.appointmentDate,
        status: { in: ACTIVE },
      },
    });

    if (taken >= CLINIC.maxPerSlot) {
      throw new AppError(409, 'This time slot is full');
    }

    // Find an existing patient using both name and normalized phone.
    const existingPatient = await tx.patient.findFirst({
      where: {
        phone: data.phone,
        name: {
          equals: data.patientName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    // Create a profile if no matching patient exists.
    const patient = existingPatient ?? await tx.patient.create({
      data: {
        name: data.patientName,
        phone: data.phone,
        email: data.email ?? null,
      },
      select: { id: true },
    });

    return tx.appointment.create({
      data: {
        patientId: patient.id,
        patientName: data.patientName,
        phone: data.phone,
        serviceId: data.serviceId,
        appointmentDate: data.appointmentDate,
        email: data.email ?? null,
        message: data.message ?? null,
      },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        service: {
          select: { name: true },
        },
      },
    });
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);
  res.status(201).json(appointment);
});

router.get(
  '/',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
  ),
  async (req, res) => {
    const filters = appointmentListQuerySchema.parse(req.query);

    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;

    const where = buildAppointmentWhere(filters);

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appointmentDate: 'asc',
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
      }),

      prisma.appointment.count({ where }),
    ]);

    res.json({
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  },
);

router.get(
  '/:id',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.DENTIST,
  ),
  async (req, res) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new AppError(400, 'Invalid appointment ID');
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError(404, 'Appointment not found');
    }

    if (res.locals.userRole === UserRole.DENTIST) {
      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: res.locals.userId,
        },
        select: {
          id: true,
        },
      });

      if (!doctor || appointment.doctorId !== doctor.id) {
        throw new AppError(
          403,
          'You are not allowed to access this appointment',
        );
      }
    }

    res.json({ appointment });
  },
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
  ),
  validateBody(updateAppointmentStatusSchema),
  async (req, res) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) throw new AppError(400, 'Invalid appointment ID');

    const { status, reason } = updateAppointmentStatusSchema.parse(req.body);
    const actorId = res.locals.userId;

    if (!actorId) throw new AppError(401, 'Authentication required');

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          appointmentDate: true,
        },
      });

      if (!appointment) throw new AppError(404, 'Appointment not found');

      const allowedTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['CANCELLED', 'NO_SHOW'],
      };

      if (!allowedTransitions[appointment.status]?.includes(status)) {
        throw new AppError(
          400,
          `Cannot change appointment from ${appointment.status} to ${status}`,
        );
      }

      if (
        status === 'NO_SHOW' &&
        appointment.appointmentDate > new Date()
      ) {
        throw new AppError(
          400,
          'An appointment cannot be marked as no-show before its scheduled time',
        );
      }

      const updated = await tx.appointment.updateMany({
        where: {
          id,
          status: appointment.status,
        },
        data: { status },
      });

      if (updated.count !== 1) {
        throw new AppError(
          409,
          'Appointment was modified by another request. Refresh and try again.',
        );
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: `APPOINTMENT_${status}`,
          entityType: 'APPOINTMENT',
          entityId: id,
          details: {
            previousStatus: appointment.status,
            newStatus: status,
            reason: reason ?? null,
          },
        },
      });

      return tx.appointment.findUnique({
        where: { id },
        include: {
          service: true,
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
        },
      });
    });

    res.json({
      message: `Appointment ${status.toLowerCase()} successfully`,
      appointment: result,
    });
  },
);


router.post(
  '/:id/check-in',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  async (req, res) => {  const id = req.params.id;

if (typeof id !== 'string') {
  throw new AppError(400, 'Invalid appointment ID');
}
  const { patientId } = checkInSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new AppError(404, 'Appointment not found');
    }

    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new AppError(
        400,
        `Cannot check in an appointment with status ${appointment.status}`
      );
    }

    let patient;

    if (patientId) {
      // Link an existing patient selected by the receptionist.
      patient = await tx.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        throw new AppError(404, 'Patient not found');
      }
    } else {
      // Create a patient only when the person physically arrives.
      patient = await tx.patient.create({
        data: {
          name: appointment.patientName,
          phone: appointment.phone,
          email: appointment.email,
        },
      });
    }

    const updatedAppointment = await tx.appointment.update({
      where: { id },
      data: {
        patientId: patient.id,
        status: AppointmentStatus.CHECKED_IN,
      },
      include: {
        patient: true,
        service: true,
      },
    });

    return updatedAppointment;
  });

  res.status(200).json({
    message: 'Patient checked in successfully',
    appointment: result,
  });
});
// ADMIN / MANAGER: Assign an appointment to a doctor.
router.patch(
  '/:id/assign-doctor',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateBody(assignDoctorSchema),
  async (req, res) => {
    const appointmentId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!appointmentId) {
      throw new AppError(400, 'Invalid appointment ID');
    }

    const { doctorId } = assignDoctorSchema.parse(req.body);

    // Check whether the appointment exists.
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new AppError(404, 'Appointment not found');
    }

    // Cancelled appointments cannot be assigned.
    if (appointment.status === 'CANCELLED') {
      throw new AppError(
        400,
        'Cannot assign a cancelled appointment',
      );
    }

    // Check whether the doctor is eligible.
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        specialization: true,
      },
    });

    if (!doctor) {
      throw new AppError(
        400,
        'Doctor not found, inactive, or not verified',
      );
    }

    // Assign the appointment.
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorId: doctor.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    });

    res.json({
      message: 'Appointment assigned successfully',
      appointment: updatedAppointment,
    });
  },
);

// DENTIST: View appointments assigned to the logged-in dentist.
router.get(
  '/my-appointments',
  requireAuth,
  requireRole(UserRole.DENTIST),
  async (req, res) => {
    const userId = res.locals.userId;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        specialization: true,
      },
    });

    if (!doctor) {
      throw new AppError(
        404,
        'Doctor profile not found for this account',
      );
    }

    const filters = appointmentListQuerySchema.parse(req.query);

    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      ...buildAppointmentWhere(filters),
      doctorId: doctor.id,
    };

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          appointmentDate: 'asc',
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.appointment.count({ where }),
    ]);

    res.json({
      doctor,
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  },
);


router.post(
  '/:id/check-in',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
  ),
  validateBody(checkInAppointmentSchema),
  async (req, res) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) throw new AppError(400, 'Invalid appointment ID');

    const { patientId } = checkInAppointmentSchema.parse(req.body);
    const actorId = res.locals.userId;

    if (!actorId) throw new AppError(401, 'Authentication required');

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id },
      });

      if (!appointment) throw new AppError(404, 'Appointment not found');

      if (appointment.status !== 'CONFIRMED') {
        throw new AppError(
          400,
          'Only confirmed appointments can be checked in',
        );
      }

      if (appointment.patientId) {
        throw new AppError(
          409,
          'This appointment is already linked to a patient',
        );
      }

      let patient;

      if (patientId) {
        patient = await tx.patient.findUnique({
          where: { id: patientId },
        });

        if (!patient) throw new AppError(404, 'Patient not found');
      } else {
        // Reuse an existing patient with the same phone number.
        patient = await tx.patient.findFirst({
          where: { phone: appointment.phone },
        });

        // Create the patient only if no matching record exists.
        if (!patient) {
          patient = await tx.patient.create({
            data: {
              name: appointment.patientName,
              phone: appointment.phone,
              email: appointment.email,
            },
          });
        }
      }

      const updated = await tx.appointment.updateMany({
        where: {
          id,
          status: 'CONFIRMED',
          patientId: null,
        },
        data: {
          status: 'CHECKED_IN',
          patientId: patient.id,
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          409,
          'Appointment was modified by another request. Refresh and try again.',
        );
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'APPOINTMENT_CHECKED_IN',
          entityType: 'APPOINTMENT',
          entityId: id,
          details: {
            patientId: patient.id,
          },
        },
      });

      return {
        patient,
        appointment: await tx.appointment.findUnique({
          where: { id },
          include: {
            service: true,
            doctor: {
              select: { id: true, name: true, specialization: true },
            },
          },
        }),
      };
    });

    res.json({
      message: 'Patient checked in successfully',
      ...result,
    });
  },
);

const appointmentsRoutes = router;
export default appointmentsRoutes;