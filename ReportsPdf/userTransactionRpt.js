const { loadIcons, drawIcon } = require('./loadIcons.js');
const { jsPDF } = require('jspdf');
const models = require('../models/index');
// const { Op } = require('sequelize');
// const { dispDate } = require('../server/routes/bookings/dateFns');
const _ = require('lodash');
const { format, parseISO } = require('date-fns');
const {
  placeBlock,
  setNoCols,
  align,
  pageHeader,
  drawHeader,
  setupDims,
  numberPages,
  getPageDimensions,
  setPageDimensions,
} = require('./pdfSetup');
// const { paymentsData, bookingsData } = require('../server/routes/bookings/accountRoutes');

const maxString = (a, b) => (a > b ? a : b);
const expendIndex = {};
let accName;

function reducedExpenditureAllocations(allocations, lastPayment) {
  if (allocations.length === 0) return { Allocations: allocations, lastPayment };
  let allocs = _.groupBy(allocations, 'paymentId');
  allocs = _.values(allocs).map((allocs) => {
    allocs = _.sortBy(allocs, 'id');
    let amount = allocs.reduce((acc, all) => acc + all.amount, 0);
    return { ..._.last(allocs), amount };
  });
  allocs = _.sortBy(allocs, 'paymentId');
  const lastAlloc = _.last(allocs);
  let id = lastAlloc.id.toString().padStart(5, '0');
  let paidBy = `${lastAlloc.paymentId}.${lastAlloc.bookingId}.${id}`;
  lastPayment = maxString(lastPayment, lastAlloc);

  return { Allocations: allocs, lastPayment, paidBy };
}
function reducedIncomeAllocations(allocations, lastBooking) {
  let allocs = allocations.filter((a) => a.refundId || a.bookingId);
  if (allocs.length === 0) return { Allocations: allocs, lastBooking };
  allocs = _.groupBy(allocs, 'bookingId');
  allocs = _.values(allocs).map((allocs) => {
    const sAllocs = _.sortBy(allocs, 'id');
    let amount = allocs.reduce((acc, all) => acc + all.amount, 0);
    const sAlloc = _.last(sAllocs);
    const bookingCreatedAt = expendIndex[sAlloc.bookingId || sAlloc.refundId].createdAt;
    let id = sAlloc.id.toString().padStart(5, '0');
    let paidFor = `${bookingCreatedAt.substr(0, 10)}.${sAlloc.bookingId}.${id}`;

    return { ...sAlloc, amount, paidFor };
  });
  allocs = _.sortBy(allocs, 'paidFor');
  lastBooking = maxString(lastBooking, _.last(allocs).bookingId);

  return { Allocations: allocs, lastBooking };
}
function addEntry(entries, createdAt, type, item) {
  const day = createdAt.substr(0, 10);
  if (!entries[day]) entries[day] = { day, expenditure: [], income: [] };
  entries[day][type].push(item);
}
// const imReady = useStoreActions((a) => a.reports.imReady);
async function getTransactionData(accountId, bookingsRaw, paymentsRaw) {
  let walks = await models.Walk.findAll({
    attributes: ['walkId', 'venue', 'fee'],
  });
  walks = _.keyBy(walks, 'walkId');
  // let bookingsRaw = await bookingsData({ accountId, startDate });
  // let paymentsRaw = await paymentsData({ accountId, startDate });
  accName = bookingsRaw.name;
  let lastPayment = '';
  let entries = {};
  _.flatMap(bookingsRaw.Members, (m) => {
    return m.Bookings.map((b) => {
      let venue = walks[b.walkId].venue;
      let createdAt = b.BookingLogs[0].id;
      const allocs = reducedExpenditureAllocations(b.Allocations, lastPayment);
      b = { ...b, ...allocs, name: m.shortName, createdAt, venue };
      addEntry(entries, createdAt, 'expenditure', b);
      expendIndex[b.bookingId] = b;
      return b;
    });
  });

  let lastBooking = '';
  let [refunds, payments] = _.partition(paymentsRaw.Payments, (p) => !!p.refundId);
  refunds.forEach((p) => {
    let createdAt = p.refundId;
    p.Allocations = _.flatMap(payments, (pp) =>
      pp.Allocations.filter((a) => a.refundId !== null && a.refundId === p.refundId),
    );
    const allocs = reducedExpenditureAllocations(p.Allocations, lastPayment);
    const spent = allocs.Allocations.reduce((acc, a) => acc + a.amount, 0);

    if (spent !== p.amount - p.available) {
      console.log('refund spend error', spent, p.amount, p.available, p.paymentId);
      p.available = p.amount - spent;
    }
    p = { ...p, ...allocs, createdAt };
    addEntry(entries, createdAt, 'expenditure', p);
    expendIndex[p.refundId] = p;
  });
  payments.forEach((p) => {
    let createdAt = p.paymentId.substr(0, 10);
    const allocs = reducedIncomeAllocations(p.Allocations, lastBooking);
    const spent = allocs.Allocations.reduce((acc, a) => acc + a.amount, 0);
    if (spent !== p.amount - p.available) {
      console.log('spend error', spent, p.amount, p.available, p.paymentId);
      p.available = p.amount - spent;
    }
    p = { ...p, ...allocs, createdAt };
    addEntry(entries, createdAt, 'income', p);
  });
  return _.sortBy(_.toPairs(entries), (d) => d[0]);
}
// async

async function userTransactionRpt(accountId, bookingsRaw, paymentsRaw) {
  let p = getPageDimensions();
  setPageDimensions(210, 297, 10, 8, 5.65);
  setNoCols(1, 3, 10, true);
  // let dims = setupDims(fields, p);
  let doc = new jsPDF('p', 'pt', 'A4');
  loadIcons(doc);
  const entries = await getTransactionData(accountId, bookingsRaw, paymentsRaw);
  // addPage(doc, p);
  pageHeader(doc, 'User Transactions Report', `${accountId} ${accName}`);

  setNoCols(1, 3, 10, false);

  doc.setLineWidth(0.75);

  const titleSize = 11;
  const memSize = 12;
  const hPad = 3;
  const vPad = 2;
  // const putHText = (right) => [right ? x + colWidth - hPad : x + hPad, y + titleSize / 2];
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
    const height = titleSize + sz * memSize;

    let lines = drawHeader(titleSize, width, 4);
    doc.setFillColor('#daf4f7').lines(lines, x, y + titleSize, [1, 1], 'FD', true);
    doc.roundedRect(x, y, width, height, 4, 4, 'S');
    doc.setFontSize(9);
    let ym = y + titleSize / 2;
    doc.text(format(parseISO(day), `EEE dd MMM ''yy`), x + width / 2, ym, align.CM);
    return height;
  };
  const horizonalLine = (y, x1, x2) => {
    doc.saveGraphicsState();
    doc.setDrawColor(128).line(x1, y, x2, y);
    doc.restoreGraphicsState();
  };
  let expY = p.body.top;
  let incY = p.body.top;
  let lines = {};
  for (let [day, { expenditure, income }] of entries) {
    const expSz = expenditure.reduce(
      (acc, bkng) => acc + Math.max(bkng.Allocations.length + (bkng.owing ? 1 : 0), 1),
      0,
    );
    const incSz = income.reduce(
      (acc, pay) => acc + Math.max(pay.Allocations.length + (pay.available ? 1 : 0), 1),
      0,
    );
    expenditure = _.sortBy(expenditure, 'paidBy');
    let top;
    if (expSz > 0 && incSz > 0) {
      top = Math.max(expY, incY);
    } else if (incSz > 0) {
      top = incY;
      expY = Math.max(expY, top + titleSize);
    } else {
      top = expY;
      incY = Math.max(incY, top + titleSize);
    }
    // let { left, right, top, width } = placeBlock(boxHeight);
    // let lines = drawHeader(titleSize, expWidth, 4);
    // doc.setFillColor('#daf4f7').lines(lines, left, top + titleSize, [1, 1], 'FD', true);
    // doc.roundedRect(expLeft, top, expWidth, boxHeight, 4, 4, 'S');
    // doc.setFontSize(9);
    // let ym = top + titleSize / 2;
    // doc.text(format(parseISO(day), 'EEE dd MMM yyyy'), left + hPad, ym, align.LM);
    if (expSz > 0) {
      const boxHeight = drawDayBox(expLeft, top, expWidth, expSz, day);
      let y = top + titleSize;
      for (let i = 0; i < expenditure.length; i++) {
        const bkng = expenditure[i];
        if (i > 0) horizonalLine(y, expLeft, expRight);
        // doc.text(format(day, 'ddd dd MMM yyyy'), left + hPad, ym, align.LM);

        // doc.setFontSize(11);
        const { walkId, status, name, venue, Allocations: allocs, owing } = bkng;
        const { BookingLogs: bLogs, paidBy } = bkng;
        const { paymentId, req, amount } = bkng;
        const sz = Math.max(bkng.Allocations.length + (bkng.owing ? 1 : 0), 1);
        let y1 = y + (sz / 2) * memSize;
        if (walkId && status) {
          drawIcon(doc, status, expRight - 24, y1, 9);
          const x = showBookingHistory(doc, bLogs, expRight - 24, y1);
          const descr = fitBox(
            doc,
            `${walkId.substr(1)} ${name} ${venue}`,
            x - expLeft - 3 - hPad,
          );
          doc.text(descr, expLeft + hPad, y1, align.LM);
          totalOwing += owing;
        }
        // doc.text(`${paidBy}`, expRight, y + 0.5 * memSize, align.LM);

        if (paymentId && req) {
          doc.text(`Refund £${amount}`, expLeft + hPad, y1, align.LM);
          drawIcon(doc, req, expLeft + hPad + 64, y1, 9);
        }

        // y += 0.5 * memSize;

        for (const all of allocs) {
          const { id, amount } = all;
          doc.text(`£${amount}`, expRight - 4, y + 0.5 * memSize, align.RM);
          lines[id] = { ...(lines[id] || {}), end: y + 0.5 * memSize };
          y += memSize;
        }

        if (owing > 0) {
          doc.saveGraphicsState();
          doc.setFont('helvetica', 'bold').setTextColor('#ff0000');
          doc.text(`£${owing}`, expRight - 4, y + 0.5 * memSize, align.RM);
          doc.restoreGraphicsState();
          // doc.setFont('helvetica', 'normal');
          y += memSize;
        }
        if (allocs.length === 0 && owing === 0) y += memSize;
      }
      expY = top + boxHeight + vPad;
    }

    if (incSz > 0) {
      const boxHeight = drawDayBox(incLeft, top, incWidth, incSz, day);
      let yp = top + titleSize;

      for (const pay of income) {
        const { Allocations: allocs, req, available, amount } = pay;
        const sz = Math.max(pay.Allocations.length + (pay.available ? 1 : 0), 1);
        let y = yp + (sz / 2) * memSize;
        doc.text(/^[+]/.test(req) ? 'Credit' : 'Paid', incRight - 24, y, align.RM);
        drawIcon(doc, req, incRight - 17, y, 9);
        doc.text(`${amount}`, incRight - hPad, y, align.RM);

        y = yp + 0.5 * memSize;
        for (const all of pay.Allocations) {
          const { id, amount } = all;
          doc.text(`£${amount}`, incLeft + hPad, y, align.LM);
          // doc.text(`${id}`, incLeft, y, align.RM);

          lines[id] = { ...(lines[id] || {}), start: y, amount };

          y += memSize;
        }
        if (available > 0) {
          doc.saveGraphicsState();
          doc.setFont('helvetica', 'bold').setTextColor('#33cc33');
          // doc.setFont('helvetica', 'bold').setTextColor('#009900');
          doc.text(`£${available}`, incLeft + hPad, y, align.LM);
          doc.restoreGraphicsState();
          // doc.setFont('helvetica', 'normal');
          y += memSize;
        }
        //  if (allocs.length === 0 && owing === 0) y += memSize;
        yp += (allocs.length + (available ? 1 : 0)) * memSize;
        totalAvailable += available;
      }
      incY = top + boxHeight + vPad;
    }
  }

  for (const line of _.values(lines)) {
    const { start, end, amount } = line;
    if (amount === 0) {
      doc.setLineDashPattern([4, 8]);
    } else {
      doc.setLineDashPattern();
    }
    start && end && doc.line(incLeft, start, expRight, end);
  }

  doc.setFont('helvetica', 'bold').setTextColor(51);
  doc.setFontSize(13.5);
  const top = Math.max(incY, expY) + 7;
  if (totalAvailable) {
    doc.text(`£${totalAvailable}`, incLeft, top, align.LT);
    doc.text(`Credit`, incLeft + 25, top, align.LT);
  }
  if (totalOwing) {
    doc.text(`£${totalOwing}`, expRight - hPad, top, align.RM);
    doc.text(`Owing`, expRight - 28, top, align.RM);
  }
  if (!totalOwing && !totalAvailable) {
    doc.text(`Account in Balance`, (expLeft + incRight) / 2, top, align.CM);
  }
  doc.setFont('helvetica', 'normal');
  doc.deletePage(1);
  let pdf = `userTransactionReport-${accountId}.pdf`;
  doc.save(`documents/${pdf}`); // will save the file in the current working directory
  return pdf;
  // if (accounts.length > 0) imReady('debts');
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
