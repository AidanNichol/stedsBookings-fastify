const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const { format } = require('date-fns');
const fs = require('fs');

async function userTransactionRpt3({ xml, name, accountId, pageEnds, unit }) {
  try {
    let pdf = `userTransactionReport-${accountId}.pdf`;
    const now = format(new Date(), 'EEE dd MMM, yyyy   HH:mm');
    const doc = new PDFDocument({ size: 'A4', margin: 20 });
    doc.pipe(fs.createWriteStream(`documents/${pdf}`)); // write to PDF
    doc.image('ReportsPdf/images/St.Edwards.col4a.png', 40, 30, { width: 40 });

    const pWidth = doc.page.width;
    const width = pWidth - 40;
    let top = 72;
    let bot = doc.page.height - 30;
    let left = doc.page.width - 140;
    doc.text('User Transactions Report', 20, 20, { align: 'center', width });
    doc.text(name, 20, 35, { align: 'center', width });
    doc.fontSize(8);
    let start = 0;
    pageEnds.forEach((e, i) => {
      if (start > 10) doc.addPage();
      // doc.addPage();
      const end = e * unit;
      let height = end - start;
      console.log('adding SVG', { start, height, pWidth }, now);
      // if (start > 0) return;
      // doc.text(`Page ${i + 1} of ${pageEnds.length}.`, 280, 480);
      const page = `Page ${i + 1} of ${pageEnds.length}.`;
      doc.text(page, left, bot, { width: 100, align: 'right' });
      doc.text(now, 40, bot);
      const xml2 = `<svg width="528" height="${height}" viewBox="0 ${
        start + 1
      } 528 ${height}">${xml}</svg>`;
      SVGtoPDF(doc, xml2, (pWidth - 528 * 0.75) / 2, top);
      start = end;
      top = 20;
    });
    // add stuff to PDF here using methods described below...

    // finalize the PDF and end the stream
    doc.end();

    return pdf;
  } catch (error) {
    console.log(error);
  }
}

exports.userTransactionRpt3 = userTransactionRpt3;
