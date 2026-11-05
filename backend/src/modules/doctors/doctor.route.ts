
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import {
  UserRole,
  Gender,
  EmploymentType,
} from '@prisma/client';

const router = Router();

const requireAdmin = [requireAuth, requireRole(UserRole.ADMIN)];

const doctorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  gender: z.nativeEnum(Gender).optional().nullable(),

  specialization: z.string().trim().min(2).max(100),
  education: z.string().trim().max(1000).optional().nullable(),
  experience: z.string().trim().max(1000).optional().nullable(),

  licenseNumber: z.string().trim().min(2).max(100),
  licenseAuthority: z.string().trim().min(2).max(150),
  licenseExpiryDate: z.coerce.date().optional().nullable(),

  employmentStartDate: z.coerce.date(),
  employmentType: z.nativeEnum(EmploymentType).default(
    EmploymentType.FULL_TIME,
  ),

  bio: z.string().trim().max(3000).optional().nullable(),
  imageUrl: z.url().optional().nullable(),

  account: z.object({
    email: z.email(),
    password: z.string().min(8).max(100),
  }).optional(),
});

const doctorSelfUpdateSchema = z.object({
  phone: z.string().min(7).max(20).optional(),
  bio: z.string().max(1000).optional(),
  imageUrl: z.string().url().nullable().optional(),
}).strict();

const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  gender: z.nativeEnum(Gender).nullable().optional(),

  specialization: z.string().trim().min(2).max(100).optional(),
  education: z.string().trim().max(1000).nullable().optional(),
  experience: z.string().trim().max(1000).nullable().optional(),

  licenseNumber: z.string().trim().min(2).max(100).optional(),
  licenseAuthority: z.string().trim().min(2).max(150).optional(),
  licenseExpiryDate: z.coerce.date().nullable().optional(),

  employmentStartDate: z.coerce.date().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),

  bio: z.string().trim().max(3000).nullable().optional(),
  imageUrl: z.url().nullable().optional(),

  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided',
);

router.get('/', async (_req, res) => {
  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      isPublished: true,
      isVerified: true,
    },
    select: {
      id: true,
      name: true,
      specialization: true,
      education: true,
      experience: true,
      imageUrl: true,
      bio: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.json(doctors);
});

// ADMIN: Get all registered doctors.
router.get('/all', ...requireAdmin, async (_req, res) => {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      },
      documents: {
        select: {
          id: true,
          documentType: true,
          status: true,
          originalFileName: true,
          uploadedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(doctors);
});

// ADMIN: Register a doctor and optionally create their login account.
router.post(
  '/',
  ...requireAdmin,
  validateBody(doctorSchema),
  async (_req, res) => {
    const data = res.locals.body as z.infer<typeof doctorSchema>;

    const passwordHash = data.account
      ? await bcrypt.hash(data.account.password, 12)
      : null;

    const doctor = await prisma.$transaction(async (tx) => {
      const newDoctor = await tx.doctor.create({
        data: {
          name: data.name,
          phone: data.phone,
          gender: data.gender ?? null,

          specialization: data.specialization,
          education: data.education ?? null,
          experience: data.experience ?? null,

          licenseNumber: data.licenseNumber,
          licenseAuthority: data.licenseAuthority,
          licenseExpiryDate: data.licenseExpiryDate ?? null,

          employmentStartDate: data.employmentStartDate,
          employmentType: data.employmentType,

          bio: data.bio ?? null,
          imageUrl: data.imageUrl ?? null,

          isActive: true,
          isVerified: false,
          isPublished: false,
        },
      });

      if (data.account && passwordHash) {
        await tx.user.create({
          data: {
            name: data.name,
            email: data.account.email,
            passwordHash,
            role: UserRole.DENTIST,
            doctorProfile: {
              connect: {
                id: newDoctor.id,
              },
            },
          },
        });
      }

      return newDoctor;
    });

    res.status(201).json({
      message: 'Doctor registered successfully. Verification is pending.',
      doctor,
    });
  },
);

// ADMIN: Update doctor information.
// ADMIN: Update doctor information.
router.patch(
  '/:id',
  ...requireAdmin,
  validateBody(updateDoctorSchema),
  async (req, res) => {
    // 1. Extract doctor ID
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new AppError(400, 'Invalid doctor ID');
    }

    // 2. Validate request body
    const data = updateDoctorSchema.parse(req.body);

    // 3. Retrieve existing doctor information
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        licenseNumber: true,
        licenseAuthority: true,
        licenseExpiryDate: true,
        specialization: true,
        education: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!existingDoctor) {
      throw new AppError(404, 'Doctor not found');
    }

    // 4. Compare old and new credentials
    const toTimestamp = (
      value: Date | string | null | undefined,
    ): number | null => {
      if (value == null) return null;

      return value instanceof Date
        ? value.getTime()
        : new Date(value).getTime();
    };

    const credentialsChanged =
      (data.licenseNumber !== undefined &&
        data.licenseNumber !== existingDoctor.licenseNumber) ||

      (data.licenseAuthority !== undefined &&
        data.licenseAuthority !== existingDoctor.licenseAuthority) ||

      (data.licenseExpiryDate !== undefined &&
        toTimestamp(data.licenseExpiryDate) !==
          toTimestamp(existingDoctor.licenseExpiryDate)) ||

      (data.specialization !== undefined &&
        data.specialization !== existingDoctor.specialization) ||

      (data.education !== undefined &&
        data.education !== existingDoctor.education);

    // 5. Check publication eligibility
    const willBeActive = data.isActive ?? existingDoctor.isActive;
    const willBeVerified = credentialsChanged
      ? false
      : existingDoctor.isVerified;

    if (
      data.isPublished === true &&
      (!willBeActive || !willBeVerified)
    ) {
      throw new AppError(
        400,
        'Only active and verified doctors can be published',
      );
    }

    // 6. Update doctor and documents transactionally
    const updatedDoctor = await prisma.$transaction(async (tx) => {
      if (credentialsChanged) {
        await tx.doctorDocument.updateMany({
          where: {
            doctorId: id,
            documentType: {
              in: [
                'PROFESSIONAL_LICENSE',
                'EDUCATION_CERTIFICATE',
              ],
            },
          },
          data: {
            status: 'PENDING',
            rejectionReason: null,
            reviewedById: null,
            reviewedAt: null,
          },
        });
      }

      return tx.doctor.update({
        where: { id },
        data: {
          ...data,

          ...(credentialsChanged
            ? {
                isVerified: false,
                verifiedAt: null,
                verifiedById: null,
                isPublished: false,
              }
            : {}),

          ...(data.isActive === false
            ? { isPublished: false }
            : {}),
        },
      });
    });

    // 7. Return response
    res.json({
      message: credentialsChanged
        ? 'Doctor updated successfully. Credentials require re-verification.'
        : 'Doctor updated successfully',
      doctor: updatedDoctor,
    });
  },
);

// DENTIST: View own profile.
router.get(
  '/me',
  requireAuth,
  requireRole(UserRole.DENTIST),
  async (_req, res) => {
    const userId = res.locals.userId;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        phone: true,
        gender: true,
        specialization: true,
        education: true,
        experience: true,
        imageUrl: true,
        bio: true,
        employmentType: true,
        employmentStartDate: true,
        isActive: true,
        isVerified: true,
        isPublished: true,
        createdAt: true,
      },
    });

    if (!doctor) {
      throw new AppError(404, 'Doctor profile not found');
    }

    res.json({ doctor });
  },
);

// ADMIN: Soft-deactivate a doctor. Preserve historical visits.
router.delete('/:id', ...requireAdmin, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) throw new AppError(400, 'Invalid doctor ID');

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    throw new AppError(404, 'Doctor not found');
  }

  await prisma.doctor.update({
    where: { id },
    data: {
      isActive: false,
      isPublished: false,
    },
  });

  res.status(200).json({
    message: 'Doctor deactivated successfully',
  });
});

export default router;