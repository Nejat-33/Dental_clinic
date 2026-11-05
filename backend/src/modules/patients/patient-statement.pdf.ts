
import PDFDocument from 'pdfkit';

export interface PatientStatementData {
  patient: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };

  period: {
    from: string | null;
    to: string | null;
  };

  summary: {
    openingBalance: string;
    charges: string;
    payments: string;
    refunds: string;
    closingBalance: string;
    currentOutstanding: string;
  };

  transactions: {
    id: string;
    type: 'INVOICE' | 'PAYMENT' | 'REFUND';
    reference: string;
    description: string;
    amount: string;
    date: string;
  }[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(value: string): string {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generatePatientStatementPDF(
  data: PatientStatementData
) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 45,
      right: 45,
    },
    bufferPages: true,
  });

  const left = 45;
  const right = 550;
  const contentWidth = right - left;

  // Header
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('DENTAL CLINIC', left, 45);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#666666')
    .text('PATIENT FINANCIAL STATEMENT', left, 73);

  doc
    .moveTo(left, 95)
    .lineTo(right, 95)
    .strokeColor('#cccccc')
    .stroke();

  // Statement period
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Statement period', left, 115);

  const period =
    data.period.from || data.period.to
      ? `${data.period.from ?? 'Beginning'} to ${data.period.to ?? 'Present'}`
      : 'All transactions';

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(period, left, 133);

  // Patient information
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Patient information', left, 165);

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Name: ${data.patient.name}`, left, 185)
    .text(`Patient ID: ${data.patient.id}`, left, 201)
    .text(`Phone: ${data.patient.phone ?? 'N/A'}`, left, 217)
    .text(`Email: ${data.patient.email ?? 'N/A'}`, left, 233);

  // Financial summary
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Financial summary', left, 270);

const summaryRows: [string, string][] = [
  ['Opening balance', data.summary.openingBalance],
  ['Charges', data.summary.charges],
  ['Payments received', data.summary.payments],
  ['Refunds issued', data.summary.refunds],
  ['Closing balance', data.summary.closingBalance],
  ['Current outstanding', data.summary.currentOutstanding],
];

  let summaryY = 295;

  for (const [label, amount] of summaryRows) {
    doc
      .font(label === 'Closing balance' ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .fillColor('#222222')
      .text(label, left, summaryY);

    doc
      .text(formatMoney(amount), 400, summaryY, {
        width: 145,
        align: 'right',
      });

    summaryY += 19;
  }

  // Transaction table
  let tableY = summaryY + 20;

  function drawTableHeader() {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#ffffff')
      .rect(left, tableY, contentWidth, 24)
      .fill('#263445');

    doc
      .fillColor('#ffffff')
      .text('Date', left + 7, tableY + 7, { width: 65 })
      .text('Type', left + 75, tableY + 7, { width: 65 })
      .text('Description', left + 145, tableY + 7, { width: 165 })
      .text('Amount', left + 335, tableY + 7, {
        width: 155,
        align: 'right',
      });

    tableY += 24;
  }

  function drawPageHeader() {
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Transaction history', left, 45);

    tableY = 70;
    drawTableHeader();
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111111')
    .text('Transaction history', left, tableY);

  tableY += 22;
  drawTableHeader();

  for (const transaction of data.transactions) {
    const descriptionHeight = doc.heightOfString(
      transaction.description,
      { width: 165 }
    );

    const rowHeight = Math.max(25, descriptionHeight + 12);

    if (tableY + rowHeight > 750) {
      doc.addPage();
      drawPageHeader();
    }

    const amountColor =
      transaction.type === 'PAYMENT'
        ? '#167344'
        : transaction.type === 'REFUND'
          ? '#b45309'
          : '#222222';

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#222222')
      .text(formatDate(transaction.date), left + 7, tableY + 7, {
        width: 65,
      })
      .text(transaction.type, left + 75, tableY + 7, {
        width: 65,
      })
      .text(transaction.description, left + 145, tableY + 7, {
        width: 165,
      });

    doc
      .fillColor(amountColor)
      .text(
        formatMoney(transaction.amount),
        left + 335,
        tableY + 7,
        { width: 155, align: 'right' }
      );

    tableY += rowHeight;

    doc
      .moveTo(left, tableY)
      .lineTo(right, tableY)
      .strokeColor('#e5e7eb')
      .stroke();
  }

  if (data.transactions.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text('No transactions found for this period.', left, tableY + 10);
  }

  // Footer on every page
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#777777')
      .text(
        `Generated: ${formatDate(new Date().toISOString())}`,
        left,
        790,
        { width: 250 }
      );

    doc.text(
      `Page ${i + 1} of ${pages.count}`,
      400,
      790,
      { width: 145, align: 'right' }
    );
  }

  return doc;
}
