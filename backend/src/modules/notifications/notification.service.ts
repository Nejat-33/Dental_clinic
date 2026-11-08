import {
  AppointmentNotificationChannel,
  AppointmentNotificationType,
    AppointmentNotificationStatus,
} from '@prisma/client';

import {prisma} from '../../lib/prisma.js';
import { buildAppointmentNotificationTemplate } from './notification.templates.js';



interface QueueAppointmentEmailInput {
  appointmentId: string;
  type: AppointmentNotificationType;
  recipient: string;
  patientName: string;
  appointmentDate: Date;
  serviceName: string;
  doctorName?: string;
  reminderLabel?: string;
  scheduledAt?: Date;
  idempotencyKey: string;
}

export async function queueAppointmentEmailNotification(
  input: QueueAppointmentEmailInput,
) {
  const template = buildAppointmentNotificationTemplate(input.type, {
    patientName: input.patientName,
    appointmentDate: input.appointmentDate,
    serviceName: input.serviceName,
    doctorName: input.doctorName,
    reminderLabel: input.reminderLabel,
  });

  return prisma.appointmentNotification.upsert({
    where: {
      idempotencyKey: input.idempotencyKey,
    },
    update: {},
    create: {
      appointmentId: input.appointmentId,
      channel: AppointmentNotificationChannel.EMAIL,
      type: input.type,
      recipient: input.recipient,
      subject: template.subject,
      message: template.message,
      scheduledAt: input.scheduledAt ?? new Date(),
      idempotencyKey: input.idempotencyKey,
    },
  });
}

interface ScheduleAppointmentNotificationsInput {
  appointmentId: string;
  recipient: string;
  patientName: string;
  appointmentDate: Date;
  serviceName: string;
  doctorName?: string;
}

export async function scheduleAppointmentNotifications(
  input: ScheduleAppointmentNotificationsInput,
) {
  const now = new Date();
  const appointmentTime = input.appointmentDate.getTime();

  if (!input.recipient.trim()) {
    throw new Error('Patient email address is required');
  }

  const jobs = [];

  // 1. Immediate confirmation email.
  jobs.push(
    queueAppointmentEmailNotification({
      ...input,
      type: AppointmentNotificationType.APPOINTMENT_CONFIRMED,
      idempotencyKey: `appointment:${input.appointmentId}:confirmed`,
      scheduledAt: now,
    }),
  );

  // 2. Reminder 24 hours before appointment.
  const reminder24h = new Date(appointmentTime - 24 * 60 * 60 * 1000);

  if (reminder24h > now) {
    jobs.push(
      queueAppointmentEmailNotification({
        ...input,
        type: AppointmentNotificationType.APPOINTMENT_REMINDER,
        reminderLabel: '24-hour reminder',
        idempotencyKey: `appointment:${input.appointmentId}:reminder:24h`,
        scheduledAt: reminder24h,
      }),
    );
  }

  // 3. Reminder 2 hours before appointment.
  const reminder2h = new Date(appointmentTime - 2 * 60 * 60 * 1000);

  if (reminder2h > now) {
    jobs.push(
      queueAppointmentEmailNotification({
        ...input,
        type: AppointmentNotificationType.APPOINTMENT_REMINDER,
        reminderLabel: '2-hour reminder',
        idempotencyKey: `appointment:${input.appointmentId}:reminder:2h`,
        scheduledAt: reminder2h,
      }),
    );
  }

  return Promise.all(jobs);
}


interface CancelAppointmentNotificationsInput {
  appointmentId: string;
  recipient: string;
  patientName: string;
  appointmentDate: Date;
  serviceName: string;
}

export async function cancelAppointmentNotifications(
  input: CancelAppointmentNotificationsInput,
) {
  // Cancel reminders that have not started processing.
  await prisma.appointmentNotification.updateMany({
    where: {
      appointmentId: input.appointmentId,
      type: AppointmentNotificationType.APPOINTMENT_REMINDER,
      status: AppointmentNotificationStatus.PENDING,
    },
    data: {
      status: AppointmentNotificationStatus.CANCELLED,
    },
  });

  // Queue the cancellation email.
  return queueAppointmentEmailNotification({
    appointmentId: input.appointmentId,
    type: AppointmentNotificationType.APPOINTMENT_CANCELLED,
    recipient: input.recipient,
    patientName: input.patientName,
    appointmentDate: input.appointmentDate,
    serviceName: input.serviceName,
    idempotencyKey: `appointment:${input.appointmentId}:cancelled`,
  });
}

interface RescheduleAppointmentNotificationsInput {
  appointmentId: string;
  recipient: string;
  patientName: string;
  appointmentDate: Date;
  serviceName: string;
  doctorName?: string;
}

export async function rescheduleAppointmentNotifications(
  input: RescheduleAppointmentNotificationsInput,
) {
  const now = new Date();

  // Cancel all old pending reminders.
  await prisma.appointmentNotification.updateMany({
    where: {
      appointmentId: input.appointmentId,
      type: AppointmentNotificationType.APPOINTMENT_REMINDER,
      status: AppointmentNotificationStatus.PENDING,
    },
    data: {
      status: AppointmentNotificationStatus.CANCELLED,
    },
  });

  const reminderOffsets = [
    { label: '24-hour reminder', milliseconds: 24 * 60 * 60 * 1000, key: '24h' },
    { label: '2-hour reminder', milliseconds: 2 * 60 * 60 * 1000, key: '2h' },
  ];

  const notifications = [];

  for (const reminder of reminderOffsets) {
    const scheduledAt = new Date(
      input.appointmentDate.getTime() - reminder.milliseconds,
    );

    if (scheduledAt <= now) continue;

    const template = buildAppointmentNotificationTemplate(
      AppointmentNotificationType.APPOINTMENT_REMINDER,
      {
        patientName: input.patientName,
        appointmentDate: input.appointmentDate,
        serviceName: input.serviceName,
        doctorName: input.doctorName,
        reminderLabel: reminder.label,
      },
    );

    const idempotencyKey =
      `appointment:${input.appointmentId}:rescheduled:${input.appointmentDate.getTime()}:${reminder.key}`;

    notifications.push(
      prisma.appointmentNotification.upsert({
        where: { idempotencyKey },
        update: {
          status: AppointmentNotificationStatus.PENDING,
          scheduledAt,
          attempts: 0,
          lastError: null,
          sentAt: null,
          subject: template.subject,
          message: template.message,
          recipient: input.recipient,
        },
        create: {
          appointmentId: input.appointmentId,
          channel: AppointmentNotificationChannel.EMAIL,
          type: AppointmentNotificationType.APPOINTMENT_REMINDER,
          recipient: input.recipient,
          subject: template.subject,
          message: template.message,
          scheduledAt,
          idempotencyKey,
        },
      }),
    );
  }

  return Promise.all(notifications);
}


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