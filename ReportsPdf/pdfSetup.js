const jetpack = require('fs-jetpack');
const { format } = require('date-fns');
const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');

const cwd = jetpack.cwd();
console.log(cwd);
const local = jetpack.cwd('./ReportsPdf');
console.log(local.cwd());
const logo = local.read('images/St.Edwards.col4a.png', 'buffer');

function pageHeader(doc, title) {
  doc.addPage();
  doc.advancedAPI((doc) => {
    const h = p.header;
    doc.addImage(logo, 'png', h.left, h.top, h.headerHt, h.headerHt);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(h.headerHt * 0.55);

    doc.text('St. Edwards ABC Fellwalkers: ' + title, h.center, h.middle, align.CM);

    doc.setFontSize(h.headerHt * 0.35);
    // doc.circle(mmToPt(200), mmToPt(17), 2, 'F');
    doc.text(timestamp, h.right, h.middle - 1, align.RB);
    p.noPages++;
    // doc.text(`Page ${pageNo++}`, rX, textY + 1, align.RT);
  });
}
function numberPages(doc) {
  // doc.advancedAPI((doc) => {
  const h = p.header;
  doc.setFontSize(h.headerHt * 0.35);
  for (let no = 1; no <= p.noPages; no++) {
    doc.setPage(no);
    doc.text(`Page ${no} of ${p.noPages}`, h.right, h.middle + 1, align.RT);
  }
  // });
}
module.exports.pageHeader = pageHeader;
module.exports.numberPages = numberPages;
const mmToPt = (mm) => mm * 2.8346;
const p = {
  width: 0,
  height: 0,
  margin: 0,
  headerHt: 0,
  end: 0,
  colGap: 0,
  rowGap: 0,
  noCols: 1,
  colNo: 1,
  colWidth: 0,
  autoBreak: true,
  x: 0,
  y: 0,
};

function setPageDimensions(
  pWidthMm,
  pHeightMm,
  pMarginMm = 10,
  pHeaderHtMm = 8,
  subHeadMm = 0,
) {
  const width = mmToPt(pWidthMm);
  const height = mmToPt(pHeightMm);
  const margin = mmToPt(pMarginMm);
  const headerHt = mmToPt(pHeaderHtMm);
  const subHead = mmToPt(subHeadMm);
  p.margin = margin;
  p.page = {
    left: 0,
    right: width,
    top: 0,
    bottom: height,
    width: width,
    height: height,
    margin: p.margin,
  };
  p.header = {
    left: margin,
    right: width - margin,
    center: p.page.width / 2,
    top: margin,
    bottom: headerHt + margin,
    middle: margin + headerHt / 2,
    width: width - 2 * margin,
    headerHt: headerHt,
    height: headerHt + subHead,
  };
  const top = p.header.bottom + 3;
  const bottom = top + subHead;
  const middle = (top + bottom) / 2;
  const { left, right, center } = p.header;
  p.header.sub = { height: subHead, top, bottom, middle, left, right, center };
  p.width = width - 2 * margin;
  p.height = height - 2 * margin - headerHt;
  // p.end = pageHeight - margin;
  p.body = {
    left: margin,
    right: width - margin,
    top: headerHt + margin + subHead + 3,
    bottom: height - margin,
    center: width / 2,
    width: width - 2 * margin,
    height: height - 2 * margin - headerHt - subHead,
  };

  p.colWidth = p.width;
  p.noPages = 0;
  p.noPages = 0;
  p.y = p.body.top;
  p.x = p.body.left;

  console.log(p);
}
function getPageDimensions() {
  return p;
}
// function setSubHeading(sz) {
//   p.header1 = p.body.top;
//   p.body.top += sz;
//   p.body.height -= sz;
//   p.y = p.body.top;
// }
const setNoCols = (noCols, rowGap, colGap, autoB = true, ftHt = 0) => {
  p.noCols = noCols;
  p.rowGap = rowGap;
  p.colGap = colGap;
  p.colNo = 1;

  p.autoBreak = autoB;
  const colWidth = (p.body.width - (noCols - 1) * p.colGap) / p.noCols;
  p.col = {
    left: p.margin,
    right: p.margin + colWidth,
    top: p.body.top,
    bottom: p.body.bottom - ftHt,
    width: colWidth,
  };
  p.x = p.col.left;
  p.y = p.col.top;
  // p.colEnd = x + p.colWidth;
  // console.log({ p.noCols, p.colWidth, x, y });
  return p.col.width;
};

const placeBlock = (height) => {
  let pageBreak = false;
  if (p.y + height > p.col.bottom + 1) {
    if (p.autoBreak) {
      pageBreak = columnBreak();
    }
  }
  const center = p.col.left + p.col.width / 2;
  const middle = p.y + height / 2;
  const bottom = p.y + height;
  p.block = { ...p.col, top: p.y, bottom, center, middle };
  p.y += height + p.rowGap;
  return { ...p.block, pageBreak };
};
function columnBreak() {
  let pageBreak = false;
  p.colNo++;
  p.x += p.col.width + p.colGap;
  p.y = p.col.top;

  if (p.colNo > p.noCols) {
    p.x = p.margin;
    pageBreak = true;
  }

  // p.colEnd = x + p.col.width;
  const center = p.x + p.col.width / 2;
  p.col = { ...p.col, left: p.x, right: p.x + p.col.width, center };
  return pageBreak;
}
function drawHeader(h, w, r) {
  const dx = 0.552284749831 * r;
  const lines = [
    [0, -h + r],
    [0, -dx, r - dx, -r, r, -r],
    [w - 2 * r, 0],
    [dx, 0, r, r - dx, r, r],
    [0, h - r],
    [-h, 0],
  ];
  return lines;
}
function truncateText(doc, text, width) {
  let fs = doc.getFontSize();
  if (doc.getStringUnitWidth(text) * fs - width <= 0) return text;
  let good = 0,
    bad = text.length;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let t = Math.floor((good + bad) / 2);
    // let testText = text.substr(0, t) + '…';
    let over = doc.getStringUnitWidth(text.substr(0, t) + '…') * fs - width;
    if (over <= 0) {
      good = t;
    } else {
      bad = t;
    }
    if (bad - good <= 1) {
      return text.substr(0, good) + '…';
    }
  }
}
exports.getPageDimensions = getPageDimensions;
exports.setPageDimensions = setPageDimensions;
exports.truncateText = truncateText;
exports.columnBreak = columnBreak;
exports.drawHeader = drawHeader;
exports.setNoCols = setNoCols;
exports.placeBlock = placeBlock;
exports.page = p;

const align = {
  CM: { align: 'center', baseline: 'middle' },
  LM: { align: 'left', baseline: 'middle' },
  RM: { align: 'right', baseline: 'middle' },
  CT: { align: 'center', baseline: 'top' },
  LT: { align: 'left', baseline: 'top' },
  RT: { align: 'right', baseline: 'top' },
  CB: { align: 'center', baseline: 'bottoB' },
  LB: { align: 'left', baseline: 'bottom' },
  RB: { align: 'right', baseline: 'bottom' },
};

exports.align = align;
