const { loadIcons, drawIcon } = require('./loadIcons.js');
const { jsPDF } = require('jspdf');
const _ = require('lodash');
const { format, parseISO } = require('date-fns');
const {
  setNoCols,
  align,
  pageHeader,
  getPageDimensions,
  setPageDimensions,
} = require('./pdfSetup');
const { prepareUserTransactionData } = require('./prepareUserTransactionData');

async function userTransactionRpt(account, bookingsRaw, paymentsRaw, refundsRaw) {
  const { accountId, name: accName } = account;
  let p = getPageDimensions();
  setPageDimensions(210, 297, 10, 8, 5.65);
  setNoCols(1, 3, 10, true);
  let doc = new jsPDF('p', 'pt', 'A4');
  loadIcons(doc);
  const { entries, bot, breaks, lines } = await prepareUserTransactionData(
    accountId,
    bookingsRaw,
    paymentsRaw,
    refundsRaw,
  );
  pageHeader(doc, 'User Transactions Report', `${accountId} ${accName}`);

  setNoCols(1, 3, 10, false);

  doc.setLineWidth(0.75);

  const memSize = 12;
  const hPad = 3;
  const vPad = 2;
  let totalAvailable = 0;
  let totalOwing = 0;
  const incRight = p.body.width + p.body.left;
  const incWidth = 75;
  const incLeft = incRight - incWidth;
  const expWidth = 200;
  const expLeft = p.body.left;
  const expRight = expLeft + expWidth;
  doc.setTextColor('#333333').setDrawColor(51);
  const drawDayBox = (x, y, width, sz, day) => {
    const height = sz * memSize;

    doc.setFillColor('#daf4f7').roundedRect(x, y + vPad, width, memSize + 1, 4, 4, 'F');
    doc.setFillColor('#ffffff').rect(x, y + memSize, width, vPad + 1, 'F');
    doc.roundedRect(x, y + vPad, width, height - vPad, 4, 4, 'S');
    doc.setFontSize(9);
    let ym = y + (memSize + vPad) / 2;
    doc.text(format(parseISO(day), `EEE dd MMM ''yy`), x + width / 2, ym, align.CM);
    horizonalLine(y + memSize, x, x + width);
    return height;
  };
  const horizonalLine = (y, x1, x2) => {
    doc.saveGraphicsState();
    doc.setDrawColor(128).line(x1, y, x2, y);
    doc.restoreGraphicsState();
  };
  let top = p.body.top;

  const yy = (y) => top + y * memSize;

  for (let { day, expenditure, income, y, expSz, incSz } of entries) {
    if (expSz > 0) {
      drawDayBox(expLeft, yy(y), expWidth, expSz, day);
      for (let i = 0; i < expenditure.length; i++) {
        const bkng = expenditure[i];
        let { walkId, status, name, venue, Allocations: allocs, owing, y, sz } = bkng;
        horizonalLine(yy(y), expLeft, expRight);
        const { BookingLogs: bLogs } = bkng;
        const { refundId, req, amount } = bkng;
        let y1 = y + sz / 2;
        if (walkId && status) {
          drawIcon(doc, status, expRight - 24, yy(y1), 9);
          const x = showBookingHistory(doc, bLogs, expRight - 24, yy(y1));
          const descr = fitBox(
            doc,
            `${walkId.substr(1)} ${name} ${venue}`,
            x - expLeft - 3 - hPad,
          );
          doc.text(descr, expLeft + hPad, yy(y1), align.LM);
          totalOwing += owing;
        }

        if (refundId && req) {
          doc.text(`Refund £${amount}`, expLeft + hPad, yy(y1), align.LM);
          drawIcon(doc, req, expLeft + hPad + 64, yy(y1), 9);
        }

        y += 0.5;
        for (const all of allocs) {
          const { amount, paymentId } = all;
          doc.saveGraphicsState();
          if (!paymentId) doc.setFont('helvetica', 'bold').setTextColor('#ff0000');
          doc.text(amount ? `£${amount}` : '—', expRight - 4, yy(y), align.RM);
          doc.restoreGraphicsState();
          y++;
        }
      }
    }

    if (incSz > 0) {
      drawDayBox(incLeft, yy(y), incWidth, incSz, day);
      doc.setFillColor('#fcfCff').rect(expRight, yy(y), incLeft - expRight, memSize, 'F');

      for (const pay of income) {
        let { Allocations: allocs, req, available, amount, y, sz } = pay;
        horizonalLine(yy(y), expLeft, expRight);
        let yp = y + sz / 2;
        doc.text(/^[+]/.test(req) ? 'Credit' : 'Paid', incRight - 24, yy(yp), align.RM);
        drawIcon(doc, req, incRight - 17, yy(yp), 9);
        doc.text(`${amount}`, incRight - hPad, yy(yp), align.RM);

        y += 0.5;
        for (const all of allocs) {
          const { amount, bookingId } = all;
          doc.saveGraphicsState();
          if (!bookingId) doc.setFont('helvetica', 'bold').setTextColor('#33cc33');
          doc.text(amount ? `£${amount}` : '—', incLeft + hPad, yy(y), align.LM);
          doc.restoreGraphicsState();

          y += 1;
        }
        totalAvailable += available;
      }
    }
  }

  for (const line of _.values(lines)) {
    const { start, end, amount } = line;
    if (amount === 0) {
      doc.setLineDashPattern([4, 8]);
    } else {
      doc.setLineDashPattern();
    }
    start && end && doc.line(incLeft, yy(start), expRight, yy(end));
  }
  doc.setLineDashPattern().setDrawColor('#ffcccc').setLineWidth(vPad);
  for (const brk of breaks) {
    const [y1, y2] = brk;
    doc.line(expLeft, yy(y1), expRight, yy(y1));
    doc.line(expRight, yy(y1), incLeft, yy(y2));
    doc.line(incLeft, yy(y2), incRight, yy(y2));
  }

  doc.setFont('helvetica', 'bold').setTextColor(51);
  doc.setFontSize(13.5);

  if (totalAvailable) {
    doc.text(`£${totalAvailable}`, incLeft, yy(bot), align.LT);
    doc.text(`Credit`, incLeft + 25, yy(bot), align.LT);
  }
  if (totalOwing) {
    doc.text(`£${totalOwing}`, expRight - hPad, yy(bot), align.RM);
    doc.text(`Owing`, expRight - 28, yy(bot), align.RM);
  }
  if (!totalOwing && !totalAvailable) {
    doc.text(`Account in Balance`, (expLeft + incRight) / 2, yy(bot), align.CM);
  }
  doc.setFont('helvetica', 'normal');
  doc.deletePage(1);
  let pdf = `userTransactionReport-${accountId}.pdf`;
  doc.save(`documents/${pdf}`); // will save the file in the current working directory
  return pdf;
}
function showBookingHistory(doc, logs, right, y1) {
  if (logs.length === 1) return right;
  logs = logs.filter((l, i) => l.req !== (logs[i - 1] || {}).req);
  let x = right;
  doc.setFontSize(6);
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (i + 1 < logs.length) drawIcon(doc, log.req, x, y1, 9);
    if (i > 0) {
      doc.text(format(parseISO(log.id), 'd/MM'), x - 5, y1, align.RM);
      x -= 25;
    }
  }
  doc.setFontSize(9);
  return x;
}

function fitBox(doc, text, width) {
  const fontSize = doc.getFontSize();
  let size = fontSize * doc.getStringUnitWidth(text);
  if (size <= width) return text;
  do {
    text = text.substr(0, text.length - 1);
    size = fontSize * doc.getStringUnitWidth(text + '…');
  } while (size > width);

  return text + '…';
}

exports.userTransactionRpt = userTransactionRpt;
