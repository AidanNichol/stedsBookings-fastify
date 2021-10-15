const {
  placeBlock,
  setNoCols,
  align,
  drawHeader,
  pageHeader,
  getPageDimensions,
  truncateText,
} = require('./pdfSetup');
const { format, parseISO } = require('date-fns');
const { drawIcon } = require('./loadIcons.js');
const {
  allBuslists,
  walkdayData,
  numberWL,
} = require('../server/routes/bookings/walkRoutes');

// const { dispDate } = require('../server/routes/bookings/dateFns');
const _ = require('lodash');
// const { shortName } = require('../models/walk');
const ftHt = 12;

async function walkDayBookingSheet(doc) {
  pageHeader(doc, 'Walk Day Sheet');

  const colWidth = setNoCols(2, 3, 10, true, ftHt);
  const res = await walkdayData();
  const openWalks = await allBuslists();
  const WL = await numberWL(openWalks);
  const docDate = openWalks[0].walkId.substr(1);
  const accounts = gatherData(res, WL[0], openWalks);
  // let x, y;
  doc.setLineWidth(0.75);

  const titleSize = 12;
  const memSize = 12;
  const hPad = 3;
  const cSize = 30;
  printWalkDates(doc, openWalks);

  const balColor = (balance) => (balance < 0 ? '#F7C5C5' : '#CCFFCF');
  const balance = (balance) => (balance > 0 ? `£+${balance}` : `£-${-balance}`);
  doc.setTextColor('#333333');
  for (const account of accounts) {
    const noMembs = account.Members.length;
    let noCodes = account.codes.length;

    const putHText = (i) => {
      let y1 = y + titleSize / 2;
      if (i === undefined) return [x + hPad, y1];
      let x1 = x + colWidth - hPad - (noCodes - i - 0.5) * cSize;
      return [x1, y1];
    };

    const putAText = (off = 0) => [
      x + hPad + off,
      y + titleSize + (noMembs * memSize) / 2,
    ];

    const putMText = (i, j) => {
      let y1 = y + titleSize + (i + 0.5) * memSize;
      let x1 = x + colWidth - hPad - (noCodes - j - 0.5) * cSize;
      return [x1, y1];
    };

    const boxHeight = titleSize + noMembs * memSize;
    const { left: x, top: y, pageBreak } = placeBlock(boxHeight);
    if (pageBreak) {
      printContinued(doc);
      pageHeader(doc, 'Walk Day Sheet');
      printWalkDates(doc, openWalks);
    }
    let lines = drawHeader(titleSize, colWidth, 4);
    doc.setTextColor(51);
    doc
      .setFillColor(account.WL ? '#b9d9eb' : '#d8bfd8')
      .lines(lines, x, y + titleSize, [1, 1], 'FD', true);
    doc.roundedRect(x, y, colWidth, boxHeight, 4, 4, 'S');
    doc.setFontSize(11);
    doc.text(account.sortName, ...putHText(), align.LM);
    account.codes.map(([, code, opacity], i) => {
      doc.saveGraphicsState();
      if (opacity) doc.setGState(new doc.GState({ opacity }));
      let [x1, y1] = putHText(i);
      doc.text(code, x1, y1, align.CM);
      doc.restoreGraphicsState();
    });
    if (account.balance !== 0) {
      let [x1, y1] = putAText();
      doc.setFillColor(balColor(account.balance));
      doc.rect(x1, y1 - memSize / 2, 25, memSize, 'F');
      doc.text(balance(account.balance), ...putAText(), align.LM);
    }
    doc.text('Pd', ...putAText(45), align.RM);
    drawIcon(doc, 'square', ...putAText(53), 9);

    account.Members.map(({ shortName, icons }, i) => {
      doc.text(shortName + '   ', ...putMText(i, 0), align.RM);

      account.codes.forEach(([walkId, , opacity], j) => {
        let icon = icons[walkId] || 'square';
        let count = null;
        if (_.isArray(icon)) {
          [icon, count, opacity = 0.5] = icon;
        }
        doc.saveGraphicsState();
        if (count) {
          doc.circle(...putMText(i, j), 5, 'S');
          doc.setFontSize(0.8 * doc.getFontSize());
          doc.setTextColor('#ff0000').text(`${count}`, ...putMText(i, j), align.CM);
        } else {
          if (opacity) doc.setGState(new doc.GState({ opacity }));
          // let [x1, y1] = putHText(i);
          drawIcon(doc, icon, ...putMText(i, j), 9);
        }
        doc.restoreGraphicsState();
      });
    });
  }

  return docDate;
}
function printContinued(doc) {
  doc.saveGraphicsState();
  doc.setFontSize(11);
  const { body } = getPageDimensions();
  doc.text('continued…', body.right, body.bottom - ftHt - 2, align.RB);

  doc.restoreGraphicsState();
}
function printWalkDates(doc, openWalks) {
  doc.saveGraphicsState();
  doc.setFontSize(11);
  const kg = 3;
  const { body } = getPageDimensions();
  const x = body.left;
  let y = body.bottom - ftHt;
  const w = body.width / Math.max(4, openWalks.length - 1);
  // const w = body.width / (openWalks.length - 1);
  let y1 = y + ftHt / 2;
  const walks = openWalks.slice(openWalks.length > 4 ? 1 : 0);
  walks.forEach((walk, i) => {
    let x1 = x + i * w;
    doc.setFillColor(i % 2 ? '#d0debb' : '#eefbb6').setDrawColor('#083309');
    doc.rect(x1, y, w, ftHt, 'FD');
    const dat = format(parseISO(walk.walkId.substr(1)), 'dd MMM');

    const venue = truncateText(doc, walk.venue, w - 39 - 2 * kg);
    doc.text(dat, x1 + kg, y1, align.LM);
    doc.text(venue, x1 + kg + 39, y1, align.LM);
  });
  // doc.rect(x, y, body.width, ftHt, 'S');
  doc.restoreGraphicsState();
}

function gatherData(accounts, WLindex, openWalks) {
  let walkCodes = openWalks.map((w, i) => {
    const code = w.shortCode || w.venue.substr(0, 4);
    return [w.walkId, code, i === 0 ? 0.4 : 1];
  });

  const nextWalkId = openWalks[0].walkId;
  accounts.forEach((account) => {
    // logit('account @start', account);
    const noMems = account.Members.length;
    let WL = true;

    account.codes = [];
    account.debt = 0;
    account.credit = account.Payments.reduce((tot, p) => tot + p.available, 0);
    account.Members.forEach((member) => {
      member.icons = {};

      member.shortName = noMems === 1 ? '' : `[${member.firstName}]`;

      member.Bookings.forEach((bkng) => {
        let icon;
        if (bkng.walkId === nextWalkId && bkng.status !== 'W') WL = false;
        account.debt += bkng.owing;
        if (bkng.walkId < nextWalkId && bkng.owing > 0) {
          const code = bkng.Walk.shortCode || bkng.Walk.venue.substr(0, 4);
          account.codes.push([bkng.walkId, code, 0.4]);
        }
        if (!bkng || bkng.status[1] === 'X') icon = 'square';
        else if (bkng.status === 'W') {
          icon = ['W', WLindex[bkng.bookingId]];
        } else if (bkng.owing > 0) icon = 'P';
        else icon = bkng.status;
        member.icons[bkng.walkId] = icon;
      });
    });
    account.codes = _.sortBy(
      _.uniqBy([...account.codes, ...walkCodes], (c) => c[0]),
      (c) => c[0],
    );
    account.balance = account.credit - account.debt;
    account.WL = WL;
  });
  let list = accounts.filter((a) => !a.WL);
  let listWL = accounts.filter((a) => a.WL);
  console.log('lists', list.length, listWL.length);
  return [..._.sortBy(list, (a) => a.sortName), ..._.sortBy(listWL, (a) => a.sortName)];
}
exports.walkDayBookingSheet = walkDayBookingSheet;
