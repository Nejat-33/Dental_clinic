import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  UserRole,
  VisitStatus,
  AppointmentStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

const router = Router();

function getId(value: string | string[] | undefined, label: string): string {
  const id = Array.isArray(value) ? value[0] : value;

  if (!id || !z.uuid().safeParse(id).success) {
    throw new AppError(400, `Invalid ${label}`);
  }

  return id;
}

const createVisitSchema = z.object({
  appointmentId: z.uuid(),
  doctorId: z.uuid().nullable().optional(),
  diagnosis: z.string().trim().min(1).max(2000).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

const updateVisitSchema = z.object({
  doctorId: z.uuid().nullable().optional(),
  diagnosis: z.string().trim().min(1).max(2000).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// Create treatment
const createTreatmentSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.number().int().min(1).max(1000).default(1),
  unitCost: z.number().min(0).max(99999999.99),
});

// Update treatment
const updateTreatmentSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  unitCost: z.number().min(0).max(99999999.99).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// List visits
const listVisitsSchema = z.object({
  patientId: z.uuid().optional(),
  doctorId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function calculateVisitTotals(
  treatments: {
    quantity: number;
    unitCost: Prisma.Decimal;
  }[],
) {
  const total = treatments.reduce(
    (sum, treatment) =>
      sum.add(treatment.unitCost.mul(treatment.quantity)),
    new Prisma.Decimal(0),
  );

  return {
    totalCost: total.toFixed(2),
    treatmentCount: treatments.length,
    totalItems: treatments.reduce(
      (sum, treatment) => sum + treatment.quantity,
      0,
    ),
  };
}

// POST /api/visits

router.post(
    "/",
    requireAuth,
    requireRole(UserRole.ADMIN, UserRole.DENTIST),
  validateBody(createVisitSchema),
  async (_req, res) => {
    const data = res.locals.body as z.infer<typeof createVisitSchema>;

    const visit = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: data.appointmentId },
      });

      if (!appointment) {
        throw new AppError(404, 'Appointment not found');
      }

      if (appointment.status !== 'CHECKED_IN') {
        throw new AppError(
          400,
          'A visit can only be created for a checked-in appointment'
        );
      }

      if (!appointment.patientId) {
        throw new AppError(
          400,
          'This appointment is not linked to a patient'
        );
      }

      const existingVisit = await tx.visit.findUnique({
        where: { appointmentId: appointment.id },
      });

      if (existingVisit) {
        throw new AppError(409, 'A visit already exists for this appointment');
      }

      if (data.doctorId) {
        const doctor = await tx.doctor.findUnique({
          where: { id: data.doctorId },
        });

        if (!doctor || !doctor.isActive) {
          throw new AppError(404, 'Active doctor not found');
        }
      }

      if (visit.status === VisitStatus.COMPLETED) {
  throw new AppError(
    400,
    'Completed visits cannot be modified',
  );
}

      return tx.visit.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: data.doctorId ?? null,
          diagnosis: data.diagnosis ?? null,
          notes: data.notes ?? null,
        },
        include: {
          patient: true,
          doctor: true,
          appointment: {
            include: { service: true },
          },
          treatments: true,
        },
      });
    });

    res.status(201).json({
      message: 'Visit created successfully',
      visit,
    });
  }
);

// GET /api/visits
// List visits with pagination and optional filters
router.get(
  '/',
  requireAuth,
  validateQuery(listVisitsSchema),
  async (_req, res) => {
    const { patientId, doctorId, page, limit } =
      res.locals.query as z.infer<typeof listVisitsSchema>;

    const where = {
      ...(patientId ? { patientId } : {}),
      ...(doctorId ? { doctorId } : {}),
    };

    const [visits, total] = await prisma.$transaction([
      prisma.visit.findMany({
        where,
        include: {
          patient: true,
          doctor: true,
          appointment: {
            include: { service: true },
          },
          treatments: true,
        },
        orderBy: { visitDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({
      data: visits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);


router.get(
  '/patient/:patientId/history',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.DENTIST,
  ),
  async (req, res) => {
    const patientId = Array.isArray(req.params.patientId)
      ? req.params.patientId[0]
      : req.params.patientId;

    if (!patientId) {
      throw new AppError(400, 'Invalid patient ID');
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!patient) {
      throw new AppError(404, 'Patient not found');
    }

    const where: Prisma.VisitWhereInput = {
      patientId,
    };

    if (res.locals.userRole === UserRole.DENTIST) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: res.locals.userId },
        select: { id: true },
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor profile not found');
      }

      where.doctorId = doctor.id;
    }

    const visits = await prisma.visit.findMany({
      where,
      orderBy: {
        visitDate: 'desc',
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        treatments: true,
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            status: true,
          },
        },
      },
    });

    const history = visits.map((visit) => ({
      ...visit,
      ...calculateVisitTotals(visit.treatments),
    }));

    const lifetimeTotal = visits.reduce(
      (sum, visit) =>
        sum.add(
          visit.treatments.reduce(
            (treatmentSum, treatment) =>
              treatmentSum.add(
                treatment.unitCost.mul(treatment.quantity),
              ),
            new Prisma.Decimal(0),
          ),
        ),
      new Prisma.Decimal(0),
    );

    res.json({
      patient,
      summary: {
        totalVisits: visits.length,
        completedVisits: visits.filter(
          (visit) => visit.status === VisitStatus.COMPLETED,
        ).length,
        lifetimeTreatmentCost: lifetimeTotal.toFixed(2),
      },
      history,
    });
  },
);


router.get('/:id', requireAuth, async (req, res) => {
  const id = getId(req.params.id, 'visit ID');

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      appointment: {
        include: { service: true },
      },
      treatments: true,
    },
  });

  if (!visit) {
    throw new AppError(404, 'Visit not found');
  }

res.json({
  visit: {
    ...visit,
    ...calculateVisitTotals(visit.treatments),
  },
});
});

// PATCH /api/visits/:id
// Update diagnosis, notes, or assigned doctor
router.patch(
  '/:id',
  requireAuth,
  validateBody(updateVisitSchema),
  async (req, res) => {
    const id = getId(req.params.id, 'visit ID');
    const data = res.locals.body as z.infer<typeof updateVisitSchema>;

    const existingVisit = await prisma.visit.findUnique({
      where: { id },
    });

    if (!existingVisit) {
      throw new AppError(404, 'Visit not found');
    }

    if (data.doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: data.doctorId },
      });

      if (!doctor || !doctor.isActive) {
        throw new AppError(404, 'Active doctor not found');
      }
    }
 
    if (existingVisit.status === VisitStatus.COMPLETED) {
  throw new AppError(
    400,
    'Completed visits cannot be modified',
  );
}
    const visit = await prisma.visit.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
        treatments: true,
      },
    });

    res.json({
      message: 'Visit updated successfully',
      visit,
    });
  }
);

// POST /api/visits/:id/treatments
// Add a treatment to a visit
router.post(
  '/:id/treatments',
  requireAuth,
  validateBody(createTreatmentSchema),
  async (req, res) => {
    const visitId = getId(req.params.id, 'visit ID');
    const data = res.locals.body as z.infer<typeof createTreatmentSchema>;

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new AppError(404, 'Visit not found');
    }

    if (visit.status === VisitStatus.COMPLETED) {
  throw new AppError(
    400,
    'Completed visits cannot be modified',
  );
}

    const treatment = await prisma.visitTreatment.create({
      data: {
        visitId,
        name: data.name,
        description: data.description ?? null,
        quantity: data.quantity,
        unitCost: data.unitCost,
      },
    });

    res.status(201).json({
      message: 'Treatment added successfully',
      treatment,
    });
  }
);

// PATCH /api/visits/:id/treatments/:treatmentId
// Update a treatment
router.patch(
  '/:id/treatments/:treatmentId',
  requireAuth,
  validateBody(updateTreatmentSchema),
  async (req, res) => {
    const visitId = getId(req.params.id, 'visit ID');
    const treatmentId = getId(req.params.treatmentId, 'treatment ID');
    const data = res.locals.body as z.infer<typeof updateTreatmentSchema>;

    const treatment = await prisma.visitTreatment.findFirst({
      where: {
        id: treatmentId,
        visitId,
      },
    });
      const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    });


    if (!treatment) {
      throw new AppError(404, 'Treatment not found in this visit');
    }

    const updatedTreatment = await prisma.visitTreatment.update({
      where: { id: treatmentId },
      data,
    });

    res.json({
      message: 'Treatment updated successfully',
      treatment: updatedTreatment,
    });
  }
);

// DELETE /api/visits/:id/treatments/:treatmentId
// Remove a treatment
router.delete(
  '/:id/treatments/:treatmentId',
  requireAuth,
  async (req, res) => {
    const visitId = getId(req.params.id, 'visit ID');
    const treatmentId = getId(req.params.treatmentId, 'treatment ID');

    const treatment = await prisma.visitTreatment.findFirst({
      where: {
        id: treatmentId,
        visitId,
      },
    });

    if (!treatment) {
      throw new AppError(404, 'Treatment not found in this visit');
    }

    await prisma.visitTreatment.delete({
      where: { id: treatmentId },
    });

    res.json({
      message: 'Treatment deleted successfully',
    });
  }
);

router.patch(
  '/:id/complete',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.DENTIST,
  ),
  async (req, res) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new AppError(400, 'Invalid visit ID');
    }

    const userId = res.locals.userId;
    const userRole = res.locals.userRole;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id },
        include: {
          appointment: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!visit) {
        throw new AppError(404, 'Visit not found');
      }

      if (visit.status === VisitStatus.COMPLETED) {
        throw new AppError(409, 'Visit is already completed');
      }

      if (visit.appointment.status !== AppointmentStatus.CHECKED_IN) {
        throw new AppError(
          400,
          'Only checked-in appointments can have completed visits',
        );
      }

      // A dentist can complete only their own assigned visit.
      if (userRole === UserRole.DENTIST) {
        const doctor = await tx.doctor.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!doctor || visit.doctorId !== doctor.id) {
          throw new AppError(
            403,
            'You are not authorized to complete this visit',
          );
        }
      }

      const updated = await tx.visit.updateMany({
        where: {
          id,
          status: VisitStatus.IN_PROGRESS,
        },
        data: {
          status: VisitStatus.COMPLETED,
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          409,
          'Visit was modified by another request',
        );
      }

      await tx.appointment.update({
        where: { id: visit.appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VISIT_COMPLETED',
          entityType: 'VISIT',
          entityId: id,
          details: {
            appointmentId: visit.appointmentId,
            patientId: visit.patientId,
            doctorId: visit.doctorId,
          },
        },
      });

      return tx.visit.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: true,
          appointment: true,
          treatments: true,
        },
      });
    });

    res.json({
      message: 'Visit completed successfully',
      visit: result,
    });
  },
);


export default router;