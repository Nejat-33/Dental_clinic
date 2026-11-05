
import { Router } from 'express';
import { AppointmentStatus, InvoiceStatus, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.use(
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  )
);

// Ethiopia local day boundaries (UTC+3).
function getEthiopianDayRange() {
  const now = new Date();

  const ethiopianNow = new Date(
    now.getTime() + 3 * 60 * 60 * 1000
  );

  const year = ethiopianNow.getUTCFullYear();
  const month = ethiopianNow.getUTCMonth();
  const day = ethiopianNow.getUTCDate();

  const start = new Date(
    Date.UTC(year, month, day) - 3 * 60 * 60 * 1000
  );

  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );

  return { start, end };
}

// GET /dashboard/overview
router.get('/overview', async (_req, res) => {
  const { start, end } = getEthiopianDayRange();

  const todayAppointments = {
    appointmentDate: {
      gte: start,
      lt: end,
    },
  };

  const [
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    checkedInAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    activeDoctors,
    upcomingAppointments,
    todayRevenue,
    outstandingInvoices,
    recentPayments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: todayAppointments,
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.PENDING,
      },
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.CONFIRMED,
      },
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.CHECKED_IN,
      },
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.COMPLETED,
      },
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.CANCELLED,
      },
    }),

    prisma.appointment.count({
      where: {
        ...todayAppointments,
        status: AppointmentStatus.NO_SHOW,
      },
    }),

    prisma.doctor.count({
      where: {
        isActive: true,
        isVerified: true,
      },
    }),

    prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: start,
          lt: end,
        },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      take: 10,
      select: {
        id: true,
        patientName: true,
        phone: true,
        appointmentDate: true,
        status: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        receivedAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    prisma.invoice.aggregate({
      where: {
        status: {
          in: [
            InvoiceStatus.PENDING,
            InvoiceStatus.PARTIALLY_PAID,
          ],
        },
      },
      _sum: {
        balance: true,
      },
      _count: {
        id: true,
      },
    }),

    prisma.payment.findMany({
      orderBy: {
        receivedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        method: true,
        receivedAt: true,
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      date: start.toISOString(),
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        checkedIn: checkedInAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        noShow: noShowAppointments,
      },
      doctors: {
        active: activeDoctors,
      },
      revenue: {
        today: todayRevenue._sum.amount ?? 0,
        paymentCount: todayRevenue._count.id,
      },
      outstanding: {
        total: outstandingInvoices._sum.balance ?? 0,
        invoiceCount: outstandingInvoices._count.id,
      },
      upcomingAppointments,
      recentPayments,
    },
  });
});

export default router;
