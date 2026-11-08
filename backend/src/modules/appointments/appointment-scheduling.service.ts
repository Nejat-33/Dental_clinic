import { AppointmentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { CLINIC } from '../../lib/clinic.js';
import { isValidSlot } from '../../lib/slots.js';
import {
  rescheduleAppointmentNotifications,
  scheduleAppointmentNotifications,
} from '../notifications/notification.service.js';

type Tx = Prisma.TransactionClient;

export const ACTIVE_STATUSES: AppointmentStatus[] = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

const appointmentInclude = {
  service: { select: { id: true, name: true } },
  doctor: { select: { id: true, name: true, specialization: true } },
} satisfies Prisma.AppointmentInclude;

export function assertBookableSlot(date: Date) {
  const t = date.getTime();
  if (t < Date.now() + CLINIC.minLeadMinutes * 60_000) {
    throw new AppError(400, 'Please choose a later time');
  }
  if (t > Date.now() + CLINIC.bookingWindowDays * 24 * 60 * 60_000) {
    throw new AppError(400, `Bookings open up to ${CLINIC.bookingWindowDays} days ahead`);
  }
  if (!isValidSlot(date)) {
    throw new AppError(400, 'Selected time is outside clinic hours');
  }
}

async function assertSlotHasCapacity(tx: Tx, date: Date, excludeAppointmentId?: string) {
  const taken = await tx.appointment.count({
    where: {
      appointmentDate: date,
      status: { in: ACTIVE_STATUSES },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });
  if (taken >= CLINIC.maxPerSlot) {
    throw new AppError(409, 'This time slot is full');
  }
}

async function findOrCreatePatient(
  tx: Tx,
  input: { name: string; phone: string; email: string | null },
) {
  const existing = await tx.patient.findFirst({
    where: { phone: input.phone, name: { equals: input.name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) return existing;
  return tx.patient.create({
    data: { name: input.name, phone: input.phone, email: input.email },
    select: { id: true },
  });
}

export type AdminCreateInput = {
  actorId: string;
  patientName: string;
  phone: string;
  email: string | null;
  serviceId: string;
  doctorId: string | null;
  appointmentDate: Date;
  message: string | null;
};

export async function createAppointmentByStaff(input: AdminCreateInput) {
  assertBookableSlot(input.appointmentDate);

  const created = await prisma.$transaction(
    async (tx) => {
      const service = await tx.service.findFirst({
        where: { id: input.serviceId, isActive: true },
        select: { id: true },
      });
      if (!service) throw new AppError(400, 'Service not available');

      const doctor = input.doctorId
        ? await tx.doctor.findFirst({
            where: { id: input.doctorId, isActive: true, isVerified: true },
            select: { id: true },
          })
        : null;
      if (input.doctorId && !doctor) {
        throw new AppError(400, 'Doctor not found, inactive, or not verified');
      }

      await assertSlotHasCapacity(tx, input.appointmentDate);

      const patient = await findOrCreatePatient(tx, {
        name: input.patientName,
        phone: input.phone,
        email: input.email,
      });

      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          patientName: input.patientName,
          phone: input.phone,
          email: input.email,
          serviceId: input.serviceId,
          appointmentDate: input.appointmentDate,
          message: input.message,
          status: AppointmentStatus.CONFIRMED,
          doctorId: doctor?.id ?? null,
        },
        include: appointmentInclude,
      });

      if (doctor) {
        await tx.appointmentAssignment.create({
          data: {
            appointmentId: appointment.id,
            doctorId: doctor.id,
            assignedById: input.actorId,
            reason: 'Assigned when booked',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: input.actorId,
          action: 'APPOINTMENT_CREATED',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          details: {
            appointmentDate: input.appointmentDate.toISOString(),
            doctorId: doctor?.id ?? null,
          },
        },
      });

      return appointment;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (created.email) {
    try {
      await scheduleAppointmentNotifications({
        appointmentId: created.id,
        recipient: created.email,
        patientName: created.patientName,
        appointmentDate: created.appointmentDate,
        serviceName: created.service.name,
        doctorName: created.doctor?.name,
      });
    } catch (error) {
      console.error('[Appointment Notification] Failed to queue notifications:', error);
    }
  }

  return created;
}

export type RescheduleInput = {
  actorId: string;
  appointmentId: string;
  appointmentDate: Date;
  reason: string | null;
};

export async function rescheduleAppointment(input: RescheduleInput) {
  assertBookableSlot(input.appointmentDate);

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findUnique({
      where: { id: input.appointmentId },
      select: { id: true, status: true, appointmentDate: true },
    });
    if (!current) throw new AppError(404, 'Appointment not found');

    if (!ACTIVE_STATUSES.includes(current.status)) {
      throw new AppError(400, `Cannot reschedule an appointment with status ${current.status}`);
    }
    if (current.appointmentDate.getTime() === input.appointmentDate.getTime()) {
      throw new AppError(400, 'Appointment is already scheduled for this time');
    }

    await assertSlotHasCapacity(tx, input.appointmentDate, current.id);

    const result = await tx.appointment.updateMany({
      where: { id: current.id, status: current.status },
      data: { appointmentDate: input.appointmentDate },
    });
    if (result.count !== 1) {
      throw new AppError(409, 'Appointment was modified by another request. Refresh and try again.');
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorId,
        action: 'APPOINTMENT_RESCHEDULED',
        entityType: 'APPOINTMENT',
        entityId: current.id,
        details: {
          previousDate: current.appointmentDate.toISOString(),
          newDate: input.appointmentDate.toISOString(),
          reason: input.reason,
        },
      },
    });

    return tx.appointment.findUniqueOrThrow({
      where: { id: current.id },
      include: appointmentInclude,
    });
  });

  if (updated.email && updated.status === AppointmentStatus.CONFIRMED) {
    try {
      await rescheduleAppointmentNotifications({
        appointmentId: updated.id,
        recipient: updated.email,
        patientName: updated.patientName,
        appointmentDate: updated.appointmentDate,
        serviceName: updated.service.name,
        doctorName: updated.doctor?.name,
      });
    } catch (error) {
      console.error('[Appointment Notification] Failed to reschedule notifications:', error);
    }
  }

  return updated;
}

export async function listAppointmentsInRange(from: Date, to: Date) {
  return prisma.appointment.findMany({
    where: { appointmentDate: { gte: from, lt: to } },
    orderBy: { appointmentDate: 'asc' },
    select: {
      id: true,
      patientName: true,
      phone: true,
      status: true,
      appointmentDate: true,
      service: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
    },
  });
}

export async function getAppointmentHistory(appointmentId: string) {
  const [assignments, events] = await Promise.all([
    prisma.appointmentAssignment.findMany({
      where: { appointmentId },
      orderBy: { assignedAt: 'desc' },
      select: {
        id: true,
        assignedAt: true,
        reason: true,
        doctor: { select: { id: true, name: true } },
        assignedBy: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: 'APPOINTMENT', entityId: appointmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);
  return { assignments, events };
}
