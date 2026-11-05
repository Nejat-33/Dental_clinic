
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  validateBody,
  validateQuery,
} from '../../middleware/validation.middleware.js';

const router = Router();

// All user-management operations require an administrator.
router.use(requireAuth, requireRole(UserRole.ADMIN));

// Create staff account
const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().toLowerCase(),
  password: z.string().min(12).max(72),
  role: z.enum(UserRole),
  doctorId: z.uuid().optional(),
}).superRefine((data, ctx) => {
  if (data.role === UserRole.DENTIST && !data.doctorId) {
    ctx.addIssue({
      code: 'custom',
      path: ['doctorId'],
      message: 'A dentist account must be linked to a doctor profile',
    });
  }

  if (data.role !== UserRole.DENTIST && data.doctorId) {
    ctx.addIssue({
      code: 'custom',
      path: ['doctorId'],
      message: 'Only dentist accounts can be linked to doctor profiles',
    });
  }
});

// Update staff account
const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.email().toLowerCase().optional(),
  role: z.enum(UserRole).optional(),
  doctorId: z.uuid().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// List users
const listUsersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(UserRole).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

function getUserId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;

  if (!id || !z.uuid().safeParse(id).success) {
    throw new AppError(400, 'Invalid user ID');
  }

  return id;
}

router.post(
  '/',
  validateBody(createUserSchema),
  async (_req, res) => {
    const data = res.locals.body as z.infer<typeof createUserSchema>;

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
        const actorId = res.locals.userId as string;
      if (data.doctorId) {
        const doctor = await tx.doctor.findUnique({
          where: { id: data.doctorId },
          select: { id: true, userId: true },
        });

        if (!doctor) {
          throw new AppError(404, 'Doctor profile not found');
        }

        if (doctor.userId) {
          throw new AppError(
            409,
            'This doctor profile is already linked to a user account'
          );
        }
      }

      const createdUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
        },
      });

      if (data.doctorId) {
        await tx.doctor.update({
          where: { id: data.doctorId },
          data: { userId: createdUser.id },
        });
      }

      return createdUser;
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    res.status(201).json(safeUser);
  }
);


router.get(
  '/',
  validateQuery(listUsersSchema),
  async (_req, res) => {
    const { q, role, page, limit } =
      res.locals.query as z.infer<typeof listUsersSchema>;

    const where = {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          doctorProfile: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// GET /api/users/:id
// View staff account
router.get('/:id', async (req, res) => {
  const id = getUserId(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      doctorProfile: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json(user);
});

// PATCH /api/users/:id
// Update staff details, role, or doctor relationship
router.patch(
  '/:id',
  validateBody(updateUserSchema),
  async (req, res) => {
    const id = getUserId(req.params.id);
    const data = res.locals.body as z.infer<typeof updateUserSchema>;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        include: {
          doctorProfile: {
            select: { id: true },
          },
        },
      });

      if (!existing) {
        throw new AppError(404, 'User not found');
      }

      const nextRole = data.role ?? existing.role;

      // Never remove the last administrator.
      if (
        existing.role === UserRole.ADMIN &&
        nextRole !== UserRole.ADMIN
      ) {
        const adminCount = await tx.user.count({
          where: { role: UserRole.ADMIN },
        });

        if (adminCount <= 1) {
          throw new AppError(
            400,
            'Cannot remove the last administrator'
          );
        }
      }

      // A dentist must have a linked doctor profile.
      const nextDoctorId =
        data.doctorId === undefined
          ? existing.doctorProfile?.id ?? null
          : data.doctorId;

      if (nextRole === UserRole.DENTIST && !nextDoctorId) {
        throw new AppError(
          400,
          'A dentist account must be linked to a doctor profile'
        );
      }

      if (nextRole !== UserRole.DENTIST && nextDoctorId) {
        throw new AppError(
          400,
          'Only dentist accounts can be linked to doctor profiles'
        );
      }

      if (nextDoctorId) {
        const doctor = await tx.doctor.findUnique({
          where: { id: nextDoctorId },
          select: { id: true, userId: true },
        });

        if (!doctor) {
          throw new AppError(404, 'Doctor profile not found');
        }

        if (doctor.userId && doctor.userId !== id) {
          throw new AppError(
            409,
            'This doctor profile is already linked to another user'
          );
        }
      }

      // Detach an old doctor profile when changing or removing the link.
      if (
        existing.doctorProfile &&
        existing.doctorProfile.id !== nextDoctorId
      ) {
        await tx.doctor.update({
          where: { id: existing.doctorProfile.id },
          data: { userId: null },
        });
      }

      // Attach the new doctor profile.
      if (
        nextDoctorId &&
        existing.doctorProfile?.id !== nextDoctorId
      ) {
        await tx.doctor.update({
          where: { id: nextDoctorId },
          data: { userId: id },
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          role: nextRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          doctorProfile: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
      });
    });

    res.json(updatedUser);
  }
);

router.patch(
  '/:id/status',
  validateBody(updateUserStatusSchema),
  async (req, res) => {
    const id = getUserId(req.params.id);
    const { isActive } = res.locals.body as z.infer<
      typeof updateUserStatusSchema
    >;

    const actorId = res.locals.userId as string;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!existing) {
        throw new AppError(404, 'User not found');
      }

      if (!isActive && id === actorId) {
        throw new AppError(
          400,
          'You cannot deactivate your own account'
        );
      }

      if (
        !isActive &&
        existing.isActive &&
        existing.role === UserRole.ADMIN
      ) {
        const activeAdminCount = await tx.user.count({
          where: {
            role: UserRole.ADMIN,
            isActive: true,
          },
        });

        if (activeAdminCount <= 1) {
          throw new AppError(
            400,
            'Cannot deactivate the last active administrator'
          );
        }
      }

      const updated = await tx.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entityType: 'USER',
          entityId: id,
          details: {
            previousStatus: existing.isActive,
            newStatus: isActive,
            targetEmail: existing.email,
          },
        },
      });

      return updated;
    });

    res.json(updatedUser);
  }
);

export default router;