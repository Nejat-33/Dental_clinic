import { Router } from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

const financialReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function getDateRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+03:00`);
  const end = new Date(`${to}T00:00:00+03:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== from ||
    end.toISOString().slice(0, 10) !== to
  ) {
    throw new AppError(400, 'Invalid reporting dates');
  }

  if (start > end) {
    throw new AppError(400, 'Start date cannot be after end date');
  }

  const days =
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);

  if (days > 365) {
    throw new AppError(400, 'Maximum reporting period is 366 days');
  }

  return {
    start,
    end: new Date(end.getTime() + 24 * 60 * 60 * 1000),
  };
}

router.get(
  '/financial',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    const { from, to } = financialReportQuerySchema.parse(req.query);
    const { start, end } = getDateRange(from, to);

    const paymentWhere: Prisma.PaymentWhereInput = {
      receivedAt: {
        gte: start,
        lt: end,
      },
    };

    const completedVisitWhere: Prisma.VisitTreatmentWhereInput = {
      visit: {
        is: {
          status: 'COMPLETED',
          visitDate: {
            gte: start,
            lt: end,
          },
        },
      },
    };

    const [
      paymentSummary,
      paymentsByMethod,
      payments,
      outstandingSummary,
      treatmentRecords,
    ] = await Promise.all([
      // Actual money received during the period.
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      // Payment method breakdown.
      prisma.payment.groupBy({
        by: ['method'],
        where: paymentWhere,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      // Used to construct daily revenue.
      prisma.payment.findMany({
        where: paymentWhere,
        select: {
          amount: true,
          receivedAt: true,
        },
        orderBy: {
          receivedAt: 'asc',
        },
      }),

      // Current outstanding balances, regardless of invoice date.
      prisma.invoice.aggregate({
        where: {
          status: {
            in: ['PENDING', 'PARTIALLY_PAID'],
          },
          balance: {
            gt: 0,
          },
        },
        _sum: {
          balance: true,
        },
        _count: {
          id: true,
        },
      }),

      // Treatment charges from completed visits in the period.
      prisma.visitTreatment.findMany({
        where: completedVisitWhere,
        select: {
          serviceId: true,
          name: true,
          quantity: true,
          unitCost: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Daily revenue uses Ethiopia's UTC+3 calendar date.
    const dailyRevenue = new Map<
      string,
      Prisma.Decimal
    >();

    for (const payment of payments) {
      const date = new Date(
        payment.receivedAt.getTime() + 3 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10);

      const current =
        dailyRevenue.get(date) ?? new Prisma.Decimal(0);

      dailyRevenue.set(
        date,
        current.add(payment.amount),
      );
    }

    // Aggregate treatment charges by service.
    const treatmentRevenue = new Map<
      string,
      {
        serviceId: string | null;
        serviceName: string;
        quantity: number;
        total: Prisma.Decimal;
      }
    >();

    for (const treatment of treatmentRecords) {
      const key = treatment.serviceId ?? `unlinked:${treatment.name}`;

      const current = treatmentRevenue.get(key) ?? {
        serviceId: treatment.serviceId,
        serviceName: treatment.service?.name ?? treatment.name,
        quantity: 0,
        total: new Prisma.Decimal(0),
      };

      current.quantity += treatment.quantity;

      current.total = current.total.add(
        treatment.unitCost.mul(treatment.quantity),
      );

      treatmentRevenue.set(key, current);
    }

    const totalCollected =
      paymentSummary._sum.amount ?? new Prisma.Decimal(0);

    const outstandingBalance =
      outstandingSummary._sum.balance ?? new Prisma.Decimal(0);

    res.json({
      period: {
        from,
        to,
        timezone: 'Africa/Addis_Ababa',
      },

      summary: {
        totalCollected: totalCollected.toFixed(2),
        paymentCount: paymentSummary._count.id,
        outstandingBalance: outstandingBalance.toFixed(2),
        outstandingInvoiceCount: outstandingSummary._count.id,
      },

      dailyRevenue: Array.from(dailyRevenue.entries())
        .map(([date, amount]) => ({
          date,
          amount: amount.toFixed(2),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      paymentMethods: paymentsByMethod.map((item) => ({
        method: item.method,
        amount: (item._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
        paymentCount: item._count.id,
      })),

      treatmentRevenue: Array.from(treatmentRevenue.values())
        .map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity,
          total: item.total.toFixed(2),
        }))
        .sort((a, b) => Number(b.total) - Number(a.total)),
    });
  },
);

export default router;