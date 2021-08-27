const {
  placeBlock,
  setNoCols,
  align,
  columnBreak,
  getPageDimensions,
  pageHeader,
  page,
} = require('./pdfSetup');
const { allBuslists } = require('../server/routes/bookings/walkRoutes');

const _ = require('lodash');
const p = getPageDimensions();
const hPad = 2;

let BL = [];
let x, y;

async function busListRpt(doc) {
  let colWidth = setNoCols(4, 0, 0, false);
  let colsNeeded = 0;
  let maxFS = (p.height / 53.2) * 0.75;
  pageHeader(doc, 'Bus Lists');

  BL = await allBuslists();
  BL = BL.map((walk) => {
    walk = walk.get({ plain: true });
    walk.B = { size: 0, list: [], anno: 0 };
    walk.C = { size: 0, list: [], anno: 0 };
    walk.W = { size: 0, list: [], anno: 0 };

    walk.Bookings.forEach((bkng) => {
      bkng.sortName = bkng.Member.sortName;
      bkng.fullName = bkng.Member.fullName;
      bkng.guest = bkng.Member.memberStatus === 'guest';
      delete bkng.Member;
      walk[bkng.status].list.push(bkng);
      if (bkng.annotation) {
        doc.setFontSize(maxFS);
        let s = doc.splitTextToSize(bkng.annotation, colWidth);

        bkng.annoSize = s.length * 0.6;
        walk[bkng.status].anno += bkng.annoSize;
      }
    });
    let totLen = 0;
    ['B', 'C', 'W'].forEach((k) => {
      const listLen = walk[k].list.length;
      if (listLen) {
        walk[k].size = listLen + 1 + (k === 'B' ? 1.2 : 0) + walk[k].anno;
      }
      totLen += walk[k].size;
      walk[k].list = _.sortBy(walk[k].list, k === 'W' ? 'updatedAt' : 'sortName');
    });
    let memSize = p.height / totLen;
    let maxfMemSize = p.height / 53.2;
    memSize = Math.min(memSize, maxfMemSize);
    memSize = Math.max(memSize, 10);
    walk.noCols = totLen * memSize > p.height ? 2 : 1;
    // if (walk.W.list.length > 0) walk.noCols = 2;
    if (walk.noCols > 1) memSize = maxfMemSize;
    walk.memSize = memSize;
    walk.fs = memSize * 0.75;
    colsNeeded += walk.noCols;
    // colsNeeded = 5;
    return walk;
  });
  if (colsNeeded === 5) (colWidth = setNoCols(5, 0, 0)), false;

  doc.setLineWidth(0.75).setDrawColor(51);

  let memSize = 20;

  doc.setTextColor('#333333');
  for (const walk of BL) {
    memSize = walk.memSize;
    let fs = walk.fs;
    doc.setFontSize(fs);
    {
      let { left, top, middle, right } = placeBlock(memSize);
      doc.line(p.col.left, p.col.bottom, p.col.right, p.col.bottom);
      doc.setFillColor(192).rect(left, top, p.col.width, memSize, 'DF');
      doc.line(p.col.left, p.col.top, p.col.left, p.col.bottom);
      doc.text(walk.displayDate, left + hPad, middle, align.LM);
      doc.text(walk.longName, right - hPad, middle, align.RM);
    }
    showBooking(doc, walk.B.list, '', false, memSize, p.col.width);

    const { left, middle } = placeBlock(memSize);
    let free = walk.capacity - (walk.B.list.length || 0);
    doc.setFont('helvetica', 'bold').setTextColor(51);
    doc.text(`Seats available: ${free}`, left + hPad, middle, align.LM);
    doc.setFont('helvetica', 'normal');
    if (walk.noCols > 1) {
      columnBreak();
      placeBlock(memSize);
    }
    showBooking(doc, walk.C.list, 'Cars', false, memSize, p.col.width);
    showBooking(doc, walk.W.list, 'Waiting List', true, memSize, p.col.width);

    doc.line(p.col.right, p.col.top, p.col.right, p.col.bottom);

    columnBreak();
  }

  // if (accounts.length > 0) imReady('debts');
}
const showBooking = (doc, list, title, number, memSize, colWidth) => {
  if (list.length <= 0) return;
  if (title !== '') {
    let { left, top, middle, width } = placeBlock(memSize);
    doc.setFillColor(240).rect(left, top, width, memSize, 'DF');
    doc.text(title, left + hPad, middle, align.LM);
  }
  list.forEach((bkng, i) => {
    let { left, middle } = placeBlock(memSize);

    let name = (number ? `${i + 1}. ` : '') + bkng.sortName;
    doc.text(name, left, middle, align.LM);
    if (bkng.guest) {
      let fs = doc.getFontSize();
      let sz = doc.getStringUnitWidth(name) * doc.getFontSize();
      let gst = '✣✿⦿₲';
      gst = '(G)';
      doc.setFontSize(fs * 0.75);
      doc.text(gst, left + hPad + sz, y, align.LT);
      doc.setFontSize(fs);
    }
    if (bkng.annotation) {
      doc.saveGraphicsState();
      let fs = doc.getFontSize();
      doc.setFontSize(fs * 0.75);
      let lines = doc.splitTextToSize(bkng.annotation, colWidth);
      doc.setTextColor('#ff0000');
      for (const line of lines) {
        const { left, bottom } = placeBlock(memSize * 0.6);
        doc.text(line, left + hPad, bottom, align.LB);
      }
      doc.restoreGraphicsState();
    }
  });
};
// const getWBusListData = async () => {
//   let BL = allBuslists();
//   BL.forEach((walk) => {
//     walk.Bookings.forEach((bkng) => {
//       bkng.sortName = bkng.Member.sortName;
//       bkng.fullName = bkng.Member.fullName;
//       bkng.guest = bkng.Member.memberStatus === 'guest';
//       delete bkng.Member;
//     });
//   });
// };
// async function allBuslists() {
//   let data = await models.Walk.findAll({
//     attributes: ['walkId', 'venue', 'capacity', 'displayDate', 'longName'],
//     include: {
//       model: models.Booking,
//       required: false,
//       attributes: ['memberId', 'status', 'updatedAt', 'annotation'],
//       where: {
//         status: ['B', 'C', 'W'],
//       },
//       include: {
//         model: models.Member,
//         attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
//       },
//     },
//     order: ['walkId'],
//     where: {
//       [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
//     },
//   });
//   return data;
// }
// function numberWL(data) {
//   const WLindex = {};
//   data.forEach((walk) => {
//     const wait = _.sortBy(
//       walk.Bookings.filter((b) => b.status === 'W'),
//       (b) => b.updatedAt,
//     );
//     wait.forEach((wB, i) => (WLindex[walk.walkId + wB.memberId] = i + 1));
//   });
//   return [WLindex];
// }

exports.busListRpt = busListRpt;
