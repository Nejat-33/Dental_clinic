import { Router } from 'express';
import {
  AppointmentNotificationStatus,
  UserRole,
} from '@prisma/client';

import{ prisma }from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

const allowedStatuses = Object.values(AppointmentNotificationStatus);

// GET /api/notifications?page=1&limit=20&status=FAILED
router.get(
  '/',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const status = req.query.status?.toString();

    if (status && !allowedStatuses.includes(
      status as AppointmentNotificationStatus,
    )) {
      throw new AppError(400, 'Invalid notification status');
    }

    const where = {
      ...(status
        ? { status: status as AppointmentNotificationStatus }
        : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.appointmentNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          appointmentId: true,
          channel: true,
          type: true,
          recipient: true,
          subject: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          attempts: true,
          lastError: true,
          createdAt: true,
          appointment: {
            select: {
              patientName: true,
              appointmentDate: true,
            },
          },
        },
      }),
      prisma.appointmentNotification.count({ where }),
    ]);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);

// PATCH /api/notifications/:id/retry
router.patch(
  '/:id/retry',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new AppError(400, 'Invalid notification ID');
    }

    const actorId = res.locals.userId;

    if (!actorId) {
      throw new AppError(401, 'Authentication required');
    }

    const notification = await prisma.appointmentNotification.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    if (notification.status !== AppointmentNotificationStatus.FAILED) {
      throw new AppError(
        400,
        'Only failed notifications can be retried',
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointmentNotification.updateMany({
        where: {
          id,
          status: AppointmentNotificationStatus.FAILED,
        },
        data: {
          status: AppointmentNotificationStatus.PENDING,
          scheduledAt: new Date(),
          attempts: 0,
          lastError: null,
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          409,
          'Notification was modified by another request. Refresh and try again.',
        );
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'NOTIFICATION_RETRY',
          entityType: 'APPOINTMENT_NOTIFICATION',
          entityId: id,
          details: {
            previousStatus: 'FAILED',
            newStatus: 'PENDING',
          },
        },
      });

      return tx.appointmentNotification.findUnique({
        where: { id },
      });
    });

    res.json({
      message: 'Notification queued for retry',
      notification: result,
    });
  },
);

export default router;