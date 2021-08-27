const { jsPDF } = require('jspdf'); // will automatically load the node version
const { loadIcons } = require('./loadIcons.js');
const { numberPages } = require('./pdfSetup');
const { setPageDimensions } = require('./pdfSetup');

const { paymentsDueRpt } = require('./paymentsDueRpt.js');
const { creditsOwedRpt } = require('./creditsOwedRpt.js');
const { walkDayBookingSheet } = require('./walkDayBookingSheet.js');
const { busListRpt } = require('./busListRpt.js');
const { iconTest } = require('./iconTest.js');
const debug = false;

async function createSummaryPdf() {
  const doc = new jsPDF('p', 'pt', 'A4');
  setPageDimensions(210, 297);

  loadIcons(doc);

  let docDate = await walkDayBookingSheet(doc);

  await busListRpt(doc);

  await paymentsDueRpt(doc);

  await creditsOwedRpt(doc);

  if (debug) iconTest(doc);
  doc.deletePage(1);
  numberPages(doc);
  let pdf = `summaryReport-${docDate}.pdf`;
  doc.save(`documents/${pdf}`); // will save the file in the current working directory
  // return { img: pdf, map };
  return pdf;
}
createSummaryPdf();
exports.createSummaryPdf = createSummaryPdf;
