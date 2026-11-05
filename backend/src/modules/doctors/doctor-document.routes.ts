
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import {
  UserRole,
  DocumentStatus,
  DoctorDocumentType,
} from '@prisma/client';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const router = Router();

router.use(requireAuth, requireRole(UserRole.ADMIN));

const reviewSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().trim().max(1000).optional(),
}).refine(
  (data) =>
    data.status !== 'REJECTED' ||
    Boolean(data.rejectionReason?.trim()),
  'A rejection reason is required',
);


const storageDirectory = path.resolve(
  process.cwd(),
  'storage/private/doctor-documents',
);

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const extensionByMimeType: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, callback) => {
      try {
        await mkdir(storageDirectory, { recursive: true });
        callback(null, storageDirectory);
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (_req, file, callback) => {
      const extension = extensionByMimeType[file.mimetype];

      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new AppError(400, 'Only PDF, JPEG and PNG files are allowed'),
      );
    }

    callback(null, true);
  },
});

export default router;


// List documents for a doctor.
router.get('/doctor/:doctorId', async (req, res) => {
  const doctorId = Array.isArray(req.params.doctorId)
    ? req.params.doctorId[0]
    : req.params.doctorId;

  if (!doctorId) throw new AppError(400, 'Invalid doctor ID');

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) throw new AppError(404, 'Doctor not found');

  const documents = await prisma.doctorDocument.findMany({
    where: { doctorId },
    select: {
      id: true,
      documentType: true,
      originalFileName: true,
      mimeType: true,
      fileSize: true,
      status: true,
      rejectionReason: true,
      uploadedAt: true,
      reviewedAt: true,
      reviewedById: true,
    },
    orderBy: { uploadedAt: 'desc' },
  });

  res.json(documents);
});

// ADMIN: Upload a doctor's professional document.
router.post(
  '/doctor/:doctorId/upload',
  upload.single('file'),
  async (req, res) => {
    const doctorId = Array.isArray(req.params.doctorId)
      ? req.params.doctorId[0]
      : req.params.doctorId;

    if (!doctorId) {
      throw new AppError(400, 'Invalid doctor ID');
    }

    if (!req.file) {
      throw new AppError(400, 'Document file is required');
    }

    const documentTypeSchema = z.nativeEnum(DoctorDocumentType);

    const parsedType = documentTypeSchema.safeParse(
      req.body.documentType,
    );

    if (!parsedType.success) {
      await unlink(req.file.path);
      throw new AppError(400, 'Invalid document type');
    }

    const uploadedById = res.locals.userId;

    if (!uploadedById) {
      await unlink(req.file.path);
      throw new AppError(401, 'Authentication required');
    }

    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true },
      });

      if (!doctor) {
        throw new AppError(404, 'Doctor not found');
      }

      const document = await prisma.doctorDocument.create({
        data: {
          doctorId,
          documentType: parsedType.data,
          fileUrl: `doctor-documents/${req.file.filename}`,
          originalFileName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedById,
          status: DocumentStatus.PENDING,
        },
        select: {
          id: true,
          doctorId: true,
          documentType: true,
          originalFileName: true,
          mimeType: true,
          fileSize: true,
          status: true,
          uploadedAt: true,
        },
      });

      res.status(201).json({
        message: 'Document uploaded successfully. Awaiting review.',
        document,
      });
    } catch (error) {
      await unlink(req.file.path).catch(() => undefined);
      throw error;
    }
  },
);


router.get('/:documentId/view', async (req, res) => {
  const documentId = Array.isArray(req.params.documentId)
    ? req.params.documentId[0]
    : req.params.documentId;

  if (!documentId) {
    throw new AppError(400, 'Invalid document ID');
  }

  const document = await prisma.doctorDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      fileUrl: true,
      originalFileName: true,
      mimeType: true,
    },
  });

  if (!document) {
    throw new AppError(404, 'Document not found');
  }

  const privateDirectory = path.resolve(
    process.cwd(),
    'storage/private',
  );

  const filePath = path.resolve(
    privateDirectory,
    document.fileUrl,
  );

  // Prevent access outside the private storage directory.
  if (!filePath.startsWith(privateDirectory + path.sep)) {
    throw new AppError(403, 'Invalid document location');
  }

  try {
    await access(filePath);
  } catch {
    throw new AppError(404, 'Document file not found');
  }

  res.setHeader(
    'Content-Type',
    document.mimeType || 'application/octet-stream',
  );

  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.sendFile(filePath);
});

// Review a document.
router.patch(
  '/:documentId/review',
  validateBody(reviewSchema),
  async (req, res) => {
    const documentId = Array.isArray(req.params.documentId)
      ? req.params.documentId[0]
      : req.params.documentId;

    if (!documentId) throw new AppError(400, 'Invalid document ID');

    const data = res.locals.body as z.infer<typeof reviewSchema>;
    const reviewerId = res.locals.userId;

    if (!reviewerId) throw new AppError(401, 'Authentication required');

    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.doctorDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) throw new AppError(404, 'Document not found');

      await tx.doctorDocument.update({
        where: { id: documentId },
        data: {
          status: data.status as DocumentStatus,
          rejectionReason:
            data.status === 'REJECTED'
              ? data.rejectionReason
              : null,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      const requiredTypes: DoctorDocumentType[] = [
        DoctorDocumentType.PROFESSIONAL_LICENSE,
        DoctorDocumentType.EDUCATION_CERTIFICATE,
      ];

      const approvedDocuments = await tx.doctorDocument.findMany({
        where: {
          doctorId: document.doctorId,
          documentType: { in: requiredTypes },
          status: DocumentStatus.VERIFIED,
        },
        select: { documentType: true },
      });

      const approvedTypes = new Set(
        approvedDocuments.map((item) => item.documentType),
      );

      const isVerified = requiredTypes.every((type) =>
        approvedTypes.has(type),
      );

      const doctor = await tx.doctor.update({
        where: { id: document.doctorId },
        data: {
          isVerified,
          verifiedAt: isVerified ? new Date() : null,
          verifiedById: isVerified ? reviewerId : null,
          ...(isVerified ? {} : { isPublished: false }),
        },
      });

      return { doctor, isVerified };
    });

    res.json({
      message: 'Document review completed',
      doctorVerified: result.isVerified,
    });
  },
);
