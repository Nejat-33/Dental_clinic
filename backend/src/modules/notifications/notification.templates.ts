import { AppointmentNotificationType } from '@prisma/client';

interface AppointmentTemplateData {
  patientName: string;
  appointmentDate: Date;
  serviceName: string;
  doctorName?: string;
  reminderLabel?: string;
}

interface NotificationTemplate {
  subject: string;
  message: string;
}

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat('en-ET', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Addis_Ababa',
  }).format(date);
}

export function buildAppointmentNotificationTemplate(
  type: AppointmentNotificationType,
  data: AppointmentTemplateData,
): NotificationTemplate {
  const date = formatAppointmentDate(data.appointmentDate);
  const doctor = data.doctorName
    ? `\nDoctor: ${data.doctorName}`
    : '';

  switch (type) {
    case AppointmentNotificationType.APPOINTMENT_CONFIRMED:
      return {
        subject: 'Your dental appointment is confirmed',
        message: `Hello ${data.patientName},

Your dental appointment has been confirmed.

Service: ${data.serviceName}
Date: ${date}${doctor}

Thank you for choosing our dental clinic.`,
      };

    case AppointmentNotificationType.APPOINTMENT_REMINDER:
      return {
        subject: 'Reminder: Your upcoming dental appointment',
        message: `Hello ${data.patientName},

This is a reminder about your upcoming dental appointment${data.reminderLabel ? ` (${data.reminderLabel})` : ''}.

Service: ${data.serviceName}
Date: ${date}${doctor}

Please contact the clinic if you need to make changes.`,
      };

    case AppointmentNotificationType.APPOINTMENT_CANCELLED:
      return {
        subject: 'Your dental appointment has been cancelled',
        message: `Hello ${data.patientName},

Your dental appointment has been cancelled.

Service: ${data.serviceName}
Date: ${date}

Please contact the clinic if you would like to book another appointment.`,
      };

    case AppointmentNotificationType.APPOINTMENT_RESCHEDULED:
      return {
        subject: 'Your dental appointment has been rescheduled',
        message: `Hello ${data.patientName},

Your dental appointment has been rescheduled.

Service: ${data.serviceName}
New date: ${date}${doctor}

Please contact the clinic if you have any questions.`,
      };

    case AppointmentNotificationType.DOCTOR_ASSIGNED:
      return {
        subject: 'A dentist has been assigned to your appointment',
        message: `Hello ${data.patientName},

A dentist has been assigned to your appointment.

Service: ${data.serviceName}
Date: ${date}${doctor}

Thank you for choosing our dental clinic.`,
      };

    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported notification type: ${exhaustiveCheck}`);
    }
  }
}