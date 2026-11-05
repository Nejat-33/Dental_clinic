import { Router } from 'express';
import { InvoiceStatus, PaymentMethod, Prisma, UserRole } from '@prisma/client';import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import crypto from 'node:crypto';

const router = Router();



const createInvoiceSchema = z.object({
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

const receivePaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().max(150).optional(),
});

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const uniquePart = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `INV-${year}-${uniquePart}`;
}

const createRefundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(5).max(500),
});




router.post(
  '/from-visit/:visitId',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST),
  validateBody(createInvoiceSchema),
  async (req, res) => {
    const visitId = Array.isArray(req.params.visitId)
      ? req.params.visitId[0]
      : req.params.visitId;

    if (!visitId) {
      throw new AppError(400, 'Invalid visit ID');
    }

    const { discount, tax } = createInvoiceSchema.parse(req.body);

    const invoice = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        include: {
          treatments: true,
          invoice: true,
        },
      });

      if (!visit) {
        throw new AppError(404, 'Visit not found');
      }

      if (visit.status !== 'COMPLETED') {
        throw new AppError(
          400,
          'An invoice can only be created for a completed visit',
        );
      }

      if (visit.invoice) {
        throw new AppError(409, 'An invoice already exists for this visit');
      }

      const subtotal = visit.treatments.reduce(
        (sum, treatment) =>
          sum.add(treatment.unitCost.mul(treatment.quantity)),
        new Prisma.Decimal(0),
      );

      const discountAmount = new Prisma.Decimal(discount);
      const taxAmount = new Prisma.Decimal(tax);

      if (discountAmount.greaterThan(subtotal)) {
        throw new AppError(400, 'Discount cannot exceed the subtotal');
      }

      const total = subtotal.sub(discountAmount).add(taxAmount);

      if (total.lessThanOrEqualTo(0)) {
        throw new AppError(400, 'Invoice total must be greater than zero');
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          visitId,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total,
          amountPaid: new Prisma.Decimal(0),
          balance: total,
          status: InvoiceStatus.PENDING,
        },
        include: {
          visit: {
            include: {
              patient: true,
              treatments: true,
            },
          },
        },
      });
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice,
    });
  },
);


router.post(
  '/:invoiceId/payments',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST),
  validateBody(receivePaymentSchema),
  async (req, res) => {
    const invoiceId = Array.isArray(req.params.invoiceId)
      ? req.params.invoiceId[0]
      : req.params.invoiceId;

    if (!invoiceId) {
      throw new AppError(400, 'Invalid invoice ID');
    }

    const { amount, method, reference } =
      receivePaymentSchema.parse(req.body);

    const userId = res.locals.userId;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      if (invoice.status === InvoiceStatus.VOID) {
        throw new AppError(400, 'Cannot pay a void invoice');
      }

      const paymentAmount = new Prisma.Decimal(amount);

      if (paymentAmount.greaterThan(invoice.balance)) {
        throw new AppError(
          400,
          `Payment exceeds outstanding balance of ${invoice.balance.toFixed(2)}`,
        );
      }

      // Conditional update prevents concurrent requests from
      // collecting more than the outstanding balance.
      const updated = await tx.invoice.updateMany({
        where: {
          id: invoiceId,
          status: {
            in: [
              InvoiceStatus.PENDING,
              InvoiceStatus.PARTIALLY_PAID,
            ],
          },
          balance: {
            gte: paymentAmount,
          },
        },
        data: {
          amountPaid: {
            increment: paymentAmount,
          },
          balance: {
            decrement: paymentAmount,
          },
          status: {
            set: paymentAmount.equals(invoice.balance)
              ? InvoiceStatus.PAID
              : InvoiceStatus.PARTIALLY_PAID,
          },
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          409,
          'Invoice balance changed. Refresh and try again.',
        );
      }

      const createdPayment = await tx.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          method,
          reference,
          receivedById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_RECEIVED',
          entityType: 'PAYMENT',
          entityId: createdPayment.id,
          details: {
            invoiceId,
            amount: paymentAmount.toString(),
            method,
            reference: reference ?? null,
          },
        },
      });

      return {
        payment: createdPayment,
        invoice: await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: {
            payments: {
              orderBy: { receivedAt: 'desc' },
            },
          },
        }),
      };
    });

    res.status(201).json({
      message: 'Payment received successfully',
      ...payment,
    });
  },
);






router.post(
  '/:invoiceId/payments/:paymentId/refunds',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateBody(createRefundSchema),
  async (req, res) => {
const invoiceId = Array.isArray(req.params.invoiceId)
  ? req.params.invoiceId[0]
  : req.params.invoiceId;

const paymentId = Array.isArray(req.params.paymentId)
  ? req.params.paymentId[0]
  : req.params.paymentId;    const { amount, reason } = createRefundSchema.parse(req.body);
    const userId = res.locals.userId;

    if (!invoiceId || !paymentId) {
      throw new AppError(400, 'Invalid invoice or payment ID');
    }

    const refundAmount = new Prisma.Decimal(amount);

    const refund = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
  where: {
    id: paymentId,
    invoiceId,
    invoice: {
      status: {
        not: InvoiceStatus.VOID,
      },
    },
  },
  include: {
    invoice: true,
  },
});

      if (!payment) {
        throw new AppError(404, 'Payment not found for this invoice');
      }

      const remainingRefundable = payment.amount.minus(
        payment.refundedAmount
      );

      if (refundAmount.greaterThan(remainingRefundable)) {
        throw new AppError(
          400,
          `Maximum refundable amount is ${remainingRefundable.toFixed(2)}`
        );
      }

      if (refundAmount.greaterThan(payment.invoice.amountPaid)) {
        throw new AppError(
          400,
          'Refund amount exceeds the invoice amount paid'
        );
      }

      // Optimistic concurrency check: prevents two requests
      // from refunding the same payment balance simultaneously.
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          id: paymentId,
          refundedAmount: payment.refundedAmount,
        },
        data: {
          refundedAmount: {
            increment: refundAmount,
          },
        },
      });

      if (paymentUpdate.count !== 1) {
        throw new AppError(
          409,
          'Payment was changed by another operation. Refresh and retry.'
        );
      }

      // Update the invoice's net paid amount and outstanding balance.
      const invoiceUpdate = await tx.invoice.updateMany({
        where: {
          id: invoiceId,
          amountPaid: payment.invoice.amountPaid,
          status: {
            in: [
              InvoiceStatus.PENDING,
              InvoiceStatus.PARTIALLY_PAID,
              InvoiceStatus.PAID,
            ],
          },
        },
        data: {
          amountPaid: {
            decrement: refundAmount,
          },
          balance: {
            increment: refundAmount,
          },
          status:
            payment.invoice.amountPaid
              .minus(refundAmount)
              .equals(0)
              ? InvoiceStatus.PENDING
              : InvoiceStatus.PARTIALLY_PAID,
        },
      });

      if (invoiceUpdate.count !== 1) {
        throw new AppError(
          409,
          'Invoice was changed by another operation. Refresh and retry.'
        );
      }

      const createdRefund = await tx.refund.create({
        data: {
          paymentId,
          amount: refundAmount,
          reason,
          processedById: userId,
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              invoiceId: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_REFUNDED',
          entityType: 'Payment',
          entityId: paymentId,
          details: {
            invoiceId,
            refundId: createdRefund.id,
            amount: refundAmount.toFixed(2),
            reason,
          },
        },
      });

      return createdRefund;
    });

    res.status(201).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund,
    });
  }
);







router.get(
  '/:invoiceId',
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
  ),
  async (req, res) => {
    const invoiceId = Array.isArray(req.params.invoiceId)
      ? req.params.invoiceId[0]
      : req.params.invoiceId;

    if (!invoiceId) {
      throw new AppError(400, 'Invalid invoice ID');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        visit: {
          include: {
            patient: true,
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
              },
            },
            treatments: true,
          },
        },
        payments: {
          orderBy: { receivedAt: 'desc' },
          include: {
            receivedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    res.json({ invoice });
  },
);

export default router;