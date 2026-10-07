
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { CLINIC } from '../../lib/clinic.js';
import { clinicDayRange, isValidSlot, slotsForDate } from '../../lib/slots.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { phoneSchema } from '../../lib/phone.js';


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

const availabilitySchema = z.object({ date: z.iso.date() });

const listSchema = z.object({
  status: z.enum(AppointmentStatus).optional(),
  date: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const statusSchema = z.object({ status: z.enum(AppointmentStatus) });

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10, // keep generous: many users can share one IP on mobile networks
  message: { message: 'Too many booking requests, try again later' },
});


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
      if (!service) throw new AppError(400, 'Service not available');

      const taken = await tx.appointment.count({
        where: { appointmentDate: data.appointmentDate, status: { in: ACTIVE } },
      });
      if (taken >= CLINIC.maxPerSlot) throw new AppError(409, 'This time slot is full');

      return tx.appointment.create({
        data: {
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
          service: { select: { name: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  res.status(201).json(appointment);
});


router.get('/', requireAuth, validateQuery(listSchema), async (_req, res) => {
  const { status, date, page, limit } = res.locals.query as z.infer<typeof listSchema>;
  const where: Prisma.AppointmentWhereInput = {
    ...(status && { status }),
    ...(date && { appointmentDate: clinicDayRange(date) }),
  };

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { service: { select: { id: true, name: true } } },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new AppError(400, 'Invalid appointment ID');
  }
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: { select: { id: true, name: true } } },
  });
  if (!appointment) throw new AppError(404, 'Appointment not found');
  res.json(appointment);
});

router.patch('/:id/status', requireAuth, validateBody(statusSchema), async (req, res) => {
     const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new AppError(400, 'Invalid appointment ID');
  }
  const { status } = res.locals.body as z.infer<typeof statusSchema>;
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: { service: { select: { id: true, name: true } } },
  });
  res.json(updated);
});
const appointmentsRoutes = router;
export default appointmentsRoutes;