const { pageHeader, placeBlock, setNoCols, align, drawHeader } = require('./pdfSetup');

const { drawIcon } = require('./loadIcons.js');
const models = require('../models');
const { Op } = require('sequelize');
const { dispDate } = require('../server/routes/bookings/dateFns');
const _ = require('lodash');

async function getDebtsData() {
  let debtsData = await models.Booking.findAll({
    where: { owing: { [Op.gt]: 0 } },
    include: [
      {
        model: models.BookingLog,
        where: { fee: { [Op.ne]: 0 } },
        attributes: ['id', 'req', 'dat', 'fee', 'late'],
        // include: { model: models.Allocation, required: false },
      },
      {
        model: models.Member,
        attributes: ['firstName'],
        include: [
          {
            model: models.Account,
            attributes: ['sortName'],
            include: [{ model: models.Member, attributes: ['memberId'] }],
          },
        ],
      },
      { model: models.Walk, attributes: ['venue'] },
    ],
  });
  debtsData = debtsData.map((debt) => debt.get({ plain: true }));
  let dMap = debtsData.map((debt) => {
    const name =
      debt.Member.Account.Members.length === 1 ? '' : `[${debt.Member.firstName}]`;
    const { sortName } = debt.Member.Account;
    // logit('test b', b, $names?.get(b.memberId), accountId, $names?.get(accountId));
    const { venue } = debt.Walk;
    const displayDate = dispDate(debt.BookingLogs[0].id);
    return { ...debt, name, venue, displayDate, sortName };
  });
  dMap = _.groupBy(dMap, (b) => b.sortName);
  const pairs = _.sortBy(_.toPairs(dMap), (item) => item[0]);
  const debtsDue = pairs.map(([sortName, bookings]) => {
    const balance = bookings.reduce((tot, b) => tot + b.owing, 0);
    // const accountId = bookings[0].accountId;
    return { sortName, balance, bookings };
  });
  return debtsDue;
}
async function paymentsDueRpt(doc) {
  pageHeader(doc, 'Payments Due');

  setNoCols(3, 3, 10, true);
  const debtsDue = await getDebtsData();

  doc.setLineWidth(0.75);

  const totalDue = debtsDue.reduce((sum, account) => sum + account.balance, 0);

  const titleSize = 14;
  const memSize = 11;
  const hPad = 3;

  doc.setTextColor('#333333').setDrawColor(51);
  for (const account of debtsDue) {
    const debts = account.bookings.filter((bkng) => bkng.owing > 0);
    const boxHeight = titleSize + debts.length * memSize;
    const { left, right, top, width, pageBreak } = placeBlock(boxHeight);
    if (pageBreak) pageHeader(doc, 'Credits Owed');

    let lines = drawHeader(titleSize, width, 4);
    doc.setFillColor('#d8bfd8').lines(lines, left, top + titleSize, [1, 1], 'FD', true);
    doc.roundedRect(left, top, width, boxHeight, 4, 4, 'S');
    doc.setFontSize(11);
    let ym = top + titleSize / 2;

    doc.text(account.sortName, left + hPad, ym, align.LM);
    doc.text(`£${account.balance}`, right - hPad, ym, align.RM);
    for (let i = 0; i < debts.length; i++) {
      doc.setFontSize(9);
      const bkng = debts[i];
      // let wd = doc.getStringUnitWidth(bkng.displayDate) * 10;
      let y = top + titleSize + (i + 0.5) * memSize;

      doc.text(bkng.displayDate, left + hPad, y, align.LM);
      drawIcon(doc, bkng.status, left + hPad + 64, y, 9);
      let partCostSz = 0;
      if (bkng.owing !== bkng.fee) {
        let text = `£${bkng.owing}`;
        doc.text(text, right - hPad, y, align.RM);
        partCostSz = 9 * doc.getStringUnitWidth(text) + 4;
      }
      doc.text(
        fitBox(doc, `${bkng.name} ${bkng.venue}`, 9, width - hPad - 72 - partCostSz),
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
  doc.text(`Total Due £${totalDue}`, left, top, align.LT);
  doc.setFont('helvetica', 'normal');
  // if (accounts.length > 0) imReady('debts');
}
function fitBox(doc, text, fontSize, width) {
  let size = fontSize * doc.getStringUnitWidth(text);

  if (size <= width) return text;
  do {
    text = text.substr(0, text.length - 1);
    size = fontSize * doc.getStringUnitWidth(`${text}…`);
  } while (size > width);

  return `${text}…`;
}
exports.paymentsDueRpt = paymentsDueRpt;
