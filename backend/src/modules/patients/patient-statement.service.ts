import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import type { PatientStatementData } from './patient-statement.pdf.js';

interface StatementTransaction {
  id: string;
  type: 'INVOICE' | 'PAYMENT' | 'REFUND';
  reference: string;
  description: string;
  amount: Prisma.Decimal;
  date: Date;
}

function parseDateBoundary(value: string): Date {
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parts.length !== 3 ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new AppError(400, `Invalid date: ${value}`);
  }

  return new Date(`${value}T00:00:00+03:00`);
}

export async function buildPatientStatement(
  patientId: string,
  from?: string,
  to?: string
): Promise<PatientStatementData> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });

  if (!patient) {
    throw new AppError(404, 'Patient not found');
  }

  const fromDate = from ? parseDateBoundary(from) : null;
  const toDate = to ? parseDateBoundary(to) : null;

  if (fromDate && toDate && fromDate > toDate) {
    throw new AppError(400, '`from` must not be after `to`');
  }

  const toExclusive = toDate
    ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000)
    : null;

  const invoices = await prisma.invoice.findMany({
    where: {
      visit: {
        is: { patientId },
      },
    },
    include: {
      payments: {
        include: {
          refunds: {
            orderBy: { refundedAt: 'asc' },
          },
        },
      },
      visit: {
        select: {
          id: true,
          visitDate: true,
        },
      },
    },
    orderBy: { issuedAt: 'asc' },
  });

  const validInvoices = invoices.filter(
    (invoice) => invoice.status !== InvoiceStatus.VOID
  );

  const allTransactions: StatementTransaction[] = [];

  for (const invoice of validInvoices) {
    allTransactions.push({
      id: invoice.id,
      type: 'INVOICE',
      reference: invoice.invoiceNumber,
      description: 'Invoice issued',
      amount: new Prisma.Decimal(invoice.total),
      date: invoice.issuedAt,
    });

    for (const payment of invoice.payments) {
      allTransactions.push({
        id: payment.id,
        type: 'PAYMENT',
        reference: payment.reference ?? payment.id,
        description: `Payment received (${payment.method})`,
        amount: new Prisma.Decimal(payment.amount).negated(),
        date: payment.receivedAt,
      });

      for (const refund of payment.refunds) {
        allTransactions.push({
          id: refund.id,
          type: 'REFUND',
          reference: refund.id,
          description: refund.reason,
          amount: new Prisma.Decimal(refund.amount),
          date: refund.refundedAt,
        });
      }
    }
  }

  allTransactions.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const openingTransactions = fromDate
    ? allTransactions.filter((transaction) => transaction.date < fromDate)
    : [];

  const periodTransactions = allTransactions.filter((transaction) => {
    if (fromDate && transaction.date < fromDate) return false;
    if (toExclusive && transaction.date >= toExclusive) return false;
    return true;
  });

  const zero = new Prisma.Decimal(0);

  const sumByType = (
    transactions: StatementTransaction[],
    type: StatementTransaction['type']
  ) =>
    transactions
      .filter((transaction) => transaction.type === type)
      .reduce(
        (sum, transaction) => sum.add(transaction.amount.abs()),
        zero
      );

  const openingBalance = openingTransactions.reduce(
    (sum, transaction) => sum.add(transaction.amount),
    zero
  );

  const charges = sumByType(periodTransactions, 'INVOICE');
  const payments = sumByType(periodTransactions, 'PAYMENT');
  const refunds = sumByType(periodTransactions, 'REFUND');

  const closingBalance = openingBalance
    .add(charges)
    .sub(payments)
    .add(refunds);

  const currentOutstanding = validInvoices.reduce(
    (sum, invoice) => sum.add(invoice.balance),
    zero
  );

  return {
    patient,
    period: {
      from: from ?? null,
      to: to ?? null,
    },
    summary: {
      openingBalance: openingBalance.toFixed(2),
      charges: charges.toFixed(2),
      payments: payments.toFixed(2),
      refunds: refunds.toFixed(2),
      closingBalance: closingBalance.toFixed(2),
      currentOutstanding: currentOutstanding.toFixed(2),
    },
    transactions: periodTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      reference: transaction.reference,
      description: transaction.description,
      amount: transaction.amount.toFixed(2),
      date: transaction.date.toISOString(),
    })),
  };
}