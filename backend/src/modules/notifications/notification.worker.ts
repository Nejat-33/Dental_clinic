import {
  AppointmentNotificationStatus,
} from '@prisma/client';

import{ prisma }from '../../lib/prisma.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 10_000;

const RETRY_DELAYS = [
  60_000,       // 1 minute
  5 * 60_000,   // 5 minutes
  15 * 60_000,  // 15 minutes
  60 * 60_000,  // 1 hour
];

let isRunning = false;

async function sendEmail(
  recipient: string,
  subject: string,
  message: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error(
      'RESEND_API_KEY or RESEND_FROM_EMAIL is not configured',
    );
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Resend API error (${response.status}): ${errorBody}`,
    );
  }
}

async function processNotification(notificationId: string) {
  const claimed = await prisma.appointmentNotification.updateMany({
    where: {
      id: notificationId,
      status: AppointmentNotificationStatus.PENDING,
    },
    data: {
      status: AppointmentNotificationStatus.PROCESSING,
    },
  });

  // Another worker may already have claimed it.
  if (claimed.count === 0) return;

  const notification = await prisma.appointmentNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) return;

  try {
    if (notification.channel !== 'EMAIL') {
      throw new Error(
        `Unsupported notification channel: ${notification.channel}`,
      );
    }

    await sendEmail(
      notification.recipient,
      notification.subject ?? 'Dental Clinic Notification',
      notification.message,
    );

    await prisma.appointmentNotification.update({
      where: { id: notification.id },
      data: {
        status: AppointmentNotificationStatus.SENT,
        sentAt: new Date(),
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    console.info(
      `[Notification] Sent ${notification.id} to ${notification.recipient}`,
    );
  } catch (error) {
    const nextAttempt = notification.attempts + 1;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown sending error';

    const permanentlyFailed = nextAttempt >= MAX_ATTEMPTS;

const retryDelay =
  RETRY_DELAYS[notification.attempts] ?? 60 * 60_000;
    await prisma.appointmentNotification.update({
      where: { id: notification.id },
      data: {
        attempts: nextAttempt,
        status: permanentlyFailed
          ? AppointmentNotificationStatus.FAILED
          : AppointmentNotificationStatus.PENDING,
        scheduledAt: permanentlyFailed
          ? notification.scheduledAt
          : new Date(Date.now() + retryDelay),
        lastError: errorMessage.slice(0, 2000),
      },
    });

    console.error(
      `[Notification] ${notification.id} failed: ${errorMessage}`,
    );
  }
}

async function processPendingNotifications() {
  const notifications = await prisma.appointmentNotification.findMany({
    where: {
      status: AppointmentNotificationStatus.PENDING,
      scheduledAt: { lte: new Date() },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: BATCH_SIZE,
    select: {
      id: true,
    },
  });

  for (const notification of notifications) {
    await processNotification(notification.id);
  }
}

export function startNotificationWorker() {
  if (isRunning) return;

  isRunning = true;

  console.info('[Notification] Worker started');

  const run = async () => {
    try {
      await processPendingNotifications();
    } catch (error) {
      console.error('[Notification] Worker error:', error);
    }
  };

  void run();

  setInterval(() => {
    void run();
  }, POLL_INTERVAL_MS);
}