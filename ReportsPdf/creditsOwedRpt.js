const { pageHeader, placeBlock, setNoCols, align, drawHeader } = require('./pdfSetup');

const { drawIcon } = require('./loadIcons.js');
const models = require('../models');
const { Op } = require('sequelize');
const { dispDate } = require('../server/routes/bookings/dateFns');
const _ = require('lodash');
// const account = require('../models/account');
let accounts = [];
// const imReady = useStoreActions((a) => a.reports.imReady);
async function getCreditsData() {
  accounts = [];
  let res = await models.Payment.findAll({
    order: ['paymentId'],
    where: { available: { [Op.gt]: 0 } },
    attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],
    include: [
      {
        model: models.Account,
        attributes: ['sortname'],
        include: [{ model: models.Member, attributes: ['firstName'] }],
      },
      {
        model: models.Allocation,
        required: false,
        include: {
          model: models.Booking,
          required: false,
          include: [
            {
              model: models.Walk,
              attributes: ['venue'],
            },
            { model: models.Member, attributes: ['firstName', 'shortName'] },
            {
              model: models.BookingLog,
              attributes: ['id', 'req', 'dat', 'fee', 'late'],
              // include: { model: models.Allocation, required: false },
            },
          ],
        },
      },
    ],
  });

  const creditsOwed = res.map((a) => a.get({ plain: true }));
  _.sortBy(creditsOwed, ['accountId', 'paymentId']);
  let accs = _.groupBy(creditsOwed, (cr) => cr.accountId);
  Object.entries(accs).forEach(([accountId, credits]) => {
    let acc = { accountId, name: credits[0].Account.sortname, total: 0, credits: [] };
    acc.noMembs = credits[0].Account.Members.length;

    acc.payments = [];
    for (const cr of credits) {
      acc.total += cr.available;
      // let allocations=_.groupBy(_.sortBy(p.Allocation, ['bookingId',]), 'bookingId')
      let credits = cr.Allocations.map((a) => ({
        ...a,
        ..._.pick(a.Booking, ['status', 'walkId', 'memberId']),
      })).filter((a) => a.status && a.status.match(/[BC]X/));

      credits = _.orderBy(credits, ['bookingTransactionDate'], ['desc']);
      credits = _.unionBy(credits, 'bookingId');
      credits = _.orderBy(credits, ['bookingId'], ['desc']);
      for (const credit of credits) {
        let amount = Math.min(cr.available, -credit.amount);
        if (amount > 0) {
          cr.available -= amount;
          acc.credits.push({
            date: dispDate(credit.updatedAt || credit.paymentId),
            req: credit.status,
            desc: credit.Booking.Walk.venue || '',
            name: acc.noMembs > 1 ? `[${credit.Booking.Member.firstName}]` : '',
            amount: amount,
          });
        }
      }
      if (cr.available > 0)
        acc.credits.push({
          date: dispDate(cr.paymentId),
          req: cr.req,
          desc: `(*£${cr.amount})`,
          name: '',
          amount: cr.available,
        });
    }
    accounts = [...accounts, acc];
  });
  return accounts;
}
// async

async function creditsOwedRpt(doc) {
  pageHeader(doc, 'Credits Owed');

  setNoCols(3, 3, 10, true);
  const creditsDue = await getCreditsData();

  doc.setLineWidth(0.75);

  const totalCredits = creditsDue.reduce((sum, account) => sum + account.total, 0);

  const titleSize = 14;
  const memSize = 11;
  const hPad = 3;
  // const putHText = (right) => [right ? x + colWidth - hPad : x + hPad, y + titleSize / 2];

  doc.setTextColor('#333333').setDrawColor(51);
  for (const account of creditsDue) {
    const credits = account.credits;
    const boxHeight = titleSize + credits.length * memSize;
    const { left, right, top, width, pageBreak } = placeBlock(boxHeight);
    if (pageBreak) pageHeader(doc, 'Credits Owed');

    let lines = drawHeader(titleSize, width, 4);
    doc.setFillColor('#d8bfd8').lines(lines, left, top + titleSize, [1, 1], 'FD', true);
    doc.roundedRect(left, top, width, boxHeight, 4, 4, 'S');
    doc.setFontSize(11);
    let ym = top + titleSize / 2;
    doc.text(account.name, left + hPad, ym, align.LM);
    doc.text('£' + account.total, right - hPad, ym, align.RM);
    for (let i = 0; i < credits.length; i++) {
      doc.setFontSize(9);
      const bkng = credits[i];
      let y = top + titleSize + (i + 0.5) * memSize;
      // let wd = doc.getStringUnitWidth(bkng.displayDate) * 10;
      doc.text(bkng.date, left + hPad, y, align.LM);
      drawIcon(doc, bkng.req, left + hPad + 64, y, 9);
      doc.text(
        fitBox(doc, bkng.name + ' ' + bkng.desc, 9, width - hPad - 72),
        left + hPad + 72,
        y,
        align.LM,
      );
      // {$index.get(bkng.walkId).venue || ''}
      // {shortName(bkng.memberId, account.accountId)}
    }
  }
  const { left, top } = placeBlock(20);
  doc.setFont('helvetica', 'bold').setTextColor(51);
  doc.setFontSize(13.5);
  doc.text(`Total Owed £${totalCredits}`, left, top, align.LT);
  doc.setFont('helvetica', 'normal');
  // if (accounts.length > 0) imReady('debts');
}
function fitBox(doc, text, fontSize, width) {
  let size = fontSize * doc.getStringUnitWidth(text);

  if (size <= width) return text;
  do {
    text = text.substr(0, text.length - 1);
    size = fontSize * doc.getStringUnitWidth(text + '…');
  } while (size > width);

  return text + '…';
}

exports.creditsOwedRpt = creditsOwedRpt;
