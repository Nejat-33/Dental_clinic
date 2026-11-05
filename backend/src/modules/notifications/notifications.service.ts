import {
  AppointmentNotificationChannel,
  AppointmentNotificationType,
} from '@prisma/client';

import{ prisma }from '../../lib/prisma.js';

type QueueNotificationInput = {
  appointmentId: string;
  channel: AppointmentNotificationChannel;
  type: AppointmentNotificationType;
  recipient: string;
  subject?: string;
  message: string;
  scheduledAt?: Date;
  idempotencyKey: string;
};

export async function queueNotification(
  input: QueueNotificationInput,
) {
  const recipient = input.recipient.trim();

  if (!recipient) {
    throw new Error('Notification recipient is required');
  }

  return prisma.appointmentNotification.createMany({
    data: [
      {
        appointmentId: input.appointmentId,
        channel: input.channel,
        type: input.type,
        recipient,
        subject: input.subject,
        message: input.message,
        scheduledAt: input.scheduledAt ?? new Date(),
        idempotencyKey: input.idempotencyKey,
      },
    ],
    skipDuplicates: true,
  });
}

export async function cancelPendingReminders(
  appointmentId: string,
) {
  return prisma.appointmentNotification.updateMany({
    where: {
      appointmentId,
      type: AppointmentNotificationType.APPOINTMENT_REMINDER,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  });
}