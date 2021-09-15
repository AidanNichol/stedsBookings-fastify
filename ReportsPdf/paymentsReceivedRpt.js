const {
  pageHeader,
  placeBlock,
  setNoCols,
  align,
  setSubHeading,
  numberPages,
  getPageDimensions,
  setPageDimensions,
} = require('./pdfSetup');
const { jsPDF } = require('jspdf'); // will automatically load the node version const pcexp = /^([^]*)([a-pr-uwyz]{1}[a-hk-y]?[0-9]{1,2})(\s*)([0-9]{1}[abd-jlnp-uw-z]{2})$/i;
const { format, parseISO } = require('date-fns');
const { getTimestamp } = require('../server/routes/bookings/dateFns');
const models = require('../models');
const { Op } = require('sequelize');
const { dispDate } = require('../server/routes/bookings/dateFns');
const _ = require('lodash');
// const account = require('../models/account');
// const imReady = useStoreActions((a) => a.reports.imReady);
async function getLatestBanking() {
  return await models.Banking.findOne({
    order: [['endDate', 'DESC']],
    limit: 1,
  });
}
async function getPaymentsReceivedData() {
  let paymentsData = await models.Payment.findAll({
    order: ['paymentId'],
    where: {
      [Op.and]: {
        paymentId: { [Op.gt]: '2019-04-01' },
        bankingId: { [Op.is]: null },
        req: { [Op.startsWith]: 'P' },
      },
    },
    required: false,
    attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],
    include: {
      model: models.Account,
      attributes: ['sortName'],
      include: [{ model: models.Member, attributes: ['firstName'] }],
    },
  });

  let dMap = paymentsData;
  dMap = _.groupBy(dMap, (p) => p.Account.sortName);
  const pairs = _.sortBy(_.toPairs(dMap), (item) => item[0]);
  const paymentsMade = pairs.map(([sortName, payments]) => {
    const balance = payments.reduce((tot, p) => tot + p.amount, 0);
    const accountId = payments[0].accountId;
    return { sortName, accountId, balance, payments };
  });

  return paymentsMade;
}

// async

async function paymentsReceivedRpt(doc) {
  doc = new jsPDF('p', 'pt', 'A4');

  const banking = await getLatestBanking();
  let startDate = banking.endDate;
  let endDate = getTimestamp();
  const paymentsMade = await getPaymentsReceivedData();
  let x, y;
  doc.setLineWidth(0.75);

  const totalPayments = paymentsMade.reduce((sum, account) => sum + account.balance, 0);

  const titleSize = 40;
  const memSize = 11;
  let p = getPageDimensions();
  setPageDimensions(210, 297, 10, 8, 14);
  setNoCols(2, 3, 10, true);
  // setSubHeading(titleSize);
  pageHeader(doc, 'Payments Received');
  doc.setFontSize(12);
  // const putHText = (right) => [right ? x + colWidth - hPad : x + hPad, y + titleSize / 2];
  // const putMText = (i, off = 0) => [x + hPad + off, y + titleSize + (i + 0.5) * memSize];

  doc.setTextColor(51).setDrawColor(51);
  const h = p.header.sub;

  const headerText = `${dispDate(startDate)} to ${dispDate(endDate)}`;
  doc.text(headerText, h.center, h.middle, align.CM);
  for (const { sortName, balance } of paymentsMade) {
    let { left, middle, right } = placeBlock(memSize);

    doc.text(sortName, left, middle, align.LM);
    doc.text(`£${balance}`, right, middle, align.RM);
  }
  const block = placeBlock(2 * memSize);
  x = block.left;
  y = block.middle;
  doc.setFontSize(14);

  doc.setFont('helvetica', 'bold').setTextColor(51);

  doc.text('Cash & Cheques to Bank', x, y, align.LM);
  doc.text(`£${totalPayments}`, x + 200, y, align.LM);
  doc.setFont('helvetica', 'normal').setTextColor(51);
  doc.deletePage(1);
  numberPages(doc);
  const docDate = format(parseISO(startDate), '_yyyy-MM-dd');
  let pdf = `paymentsReceived${docDate}.pdf`;
  doc.save(`documents/${pdf}`); // will save the file in the current working directory
  return pdf;
}
exports.paymentsReceivedRpt = paymentsReceivedRpt;
