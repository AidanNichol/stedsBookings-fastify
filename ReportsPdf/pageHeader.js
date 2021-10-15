// import Logo from '../images/St.EdwardsLogoSimple.svg';
const { getPageDimensions, align } = require('./pdfSetup');

const jetpack = require('fs-jetpack');
const { format } = require('date-fns');
const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');

const p = getPageDimensions();
const cwd = jetpack.cwd();
console.log(cwd);
const local = jetpack.cwd('./ReportsPdf');
console.log(local.cwd());
const logo = local.read('images/St.Edwards.col4a.png', 'buffer');
let noPages = 0;
function pageHeader(doc, title) {
  doc.addPage();
  doc.advancedAPI((doc) => {
    const h = p.header;
    doc.addImage(logo, 'png', h.left, h.top, h.headerHt, h.headerHt);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(h.headerHt * 0.55);
    // doc.circle(mmToPt(105), mmToPt(17), 2, 'F');
    doc.text('St. Edwards ABC Fellwalkers: ' + title, h.center, h.middle, align.CM);

    doc.setFontSize(h.headerHt * 0.35);
    // doc.circle(mmToPt(200), mmToPt(17), 2, 'F');
    doc.text(timestamp, h.right, h.middle - 1, align.RB);
    noPages++;
    // doc.text(`Page ${pageNo++}`, rX, textY + 1, align.RT);
  });
}
function numberPages(doc) {
  // doc.advancedAPI((doc) => {
  const h = p.headerHt;
  doc.setFontSize(h.headerHt * 0.35);
  for (let no = 1; no <= noPages; no++) {
    doc.setPage(no);
    doc.text(`Page ${no} of ${noPages}`, h.right, h.middle + 1, align.RT);
  }
  // });
}
module.exports.pageHeader = pageHeader;
module.exports.numberPages = numberPages;
