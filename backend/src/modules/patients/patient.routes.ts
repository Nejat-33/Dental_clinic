import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { phoneSchema } from '../../lib/phone.js';
import { UserRole} from '@prisma/client';
import { requireRole } from '../../middleware/requireRole.js';
import { buildPatientStatement } from './patient-statement.service.js';
import { generatePatientStatementPDF } from './patient-statement.pdf.js';


const router = Router();

// Patient creation
const createPatientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  email: z.email().toLowerCase().nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
});

// Patient update
const updatePatientSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  email: z.email().toLowerCase().nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const listPatientsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function getPatientId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;

  if (!id || !z.uuid().safeParse(id).success) {
    throw new AppError(400, 'Invalid patient ID');
  }

  return id;
}

const financialStatementQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  ({ from, to }) => !from || !to || from <= to,
  { message: '`from` must not be after `to`' }
);

function ethiopianDateBoundary(value: string): Date {
  const parts = value.split('-');

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    parts.length !== 3 ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new AppError(400, `Invalid date: ${value}`);
  }

  const calendarDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new AppError(400, `Invalid date: ${value}`);
  }

  return new Date(`${value}T00:00:00+03:00`);
}


// POST /api/patients
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validateBody(createPatientSchema),
  async (_req, res) => {   const data = res.locals.body as z.infer<typeof createPatientSchema>;

  const patient = await prisma.patient.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
    },
  });

  res.status(201).json(patient);
});

// GET /api/patients
router.get(
  '/',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validateQuery(listPatientsSchema),
  async (_req, res) => {  const { q, page, limit } = res.locals.query as z.infer<typeof listPatientsSchema>;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/patients/:id
router.get('/:id', requireAuth, requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST), async (req, res) => {
  const id = getPatientId(req.params.id);

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { appointmentDate: 'desc' },
        include: {
          service: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!patient) throw new AppError(404, 'Patient not found');

  res.json(patient);
});

// PATCH /api/patients/:id
router.patch('/:id', requireAuth, requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST), validateBody(updatePatientSchema), async (req, res) => {
  const id = getPatientId(req.params.id);
  const data = res.locals.body as z.infer<typeof updatePatientSchema>;

  const existing = await prisma.patient.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) throw new AppError(404, 'Patient not found');

  const patient = await prisma.patient.update({
    where: { id },
    data,
  });

  res.json(patient);
});


// GET /api/patients/:patientId/financial-statement
router.get(
  '/:patientId/financial-statement',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  validateQuery(financialStatementQuerySchema),
  async (req, res) => {
    const patientId = getPatientId(req.params.patientId);
    const { from, to } = res.locals.query as z.infer<
      typeof financialStatementQuerySchema
    >;

    const statement = await buildPatientStatement(
      patientId,
      from,
      to
    );

    res.status(200).json({
      success: true,
      data: {
        ...statement,
        transactionCount: statement.transactions.length,
      },
    });
  }
);

// GET /api/patients/:patientId/financial-statement/pdf
router.get(
  '/:patientId/financial-statement/pdf',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  validateQuery(financialStatementQuerySchema),
  async (req, res) => {
    const patientId = getPatientId(req.params.patientId);
    const { from, to } = res.locals.query as z.infer<
      typeof financialStatementQuerySchema
    >;

    const statement = await buildPatientStatement(
      patientId,
      from,
      to
    );

    const pdf = generatePatientStatementPDF(statement);

    const safePatientName = statement.patient.name
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="patient-statement-${safePatientName}.pdf"`
    );

    pdf.pipe(res);
    pdf.end();
  }
);


export default router;