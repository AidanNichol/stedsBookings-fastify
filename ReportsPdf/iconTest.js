// import Logo from '../images/St.EdwardsLogoSimple.svg';
const { drawIcon } = require('./loadIcons.js');
const { truncateText, top, right } = require('./pdfSetup');
const { pageHeader } = require('./pageHeader.js');

function iconTest(doc) {
  pageHeader(doc, 'Icon Test');

  let text = 'a quite long annotation string just for test purpose';
  doc.advancedAPI((doc) => {
    let wd = 200;
    doc.setFontSize(19);

    for (let fs = 4; fs < 20; fs++) {
      doc.setFontSize(fs);
      let text2 = truncateText(doc, text, wd);
      let y = 100 + 20 * fs;
      doc.rect(150, y, wd, fs, 'S');
      doc.text(`${fs}`, 140, y, { ...right, ...top });
      doc.text(text2, 150, y, top);
    }

    doc.circle(5, 600, 2, 'F');
    doc.circle(5, 700, 2, 'F');
    doc.circle(100, 650, 2, 'F');
    doc.circle(200, 650, 2, 'F');
    doc.circle(300, 650, 2, 'F');
    doc.circle(400, 650, 2, 'F');
    drawIcon(doc, 'B', 100, 600, 60);
    drawIcon(doc, 'C', 200, 600, 60);
    drawIcon(doc, 'BX', 300, 600, 60);
    drawIcon(doc, 'CX', 400, 600, 60);
    drawIcon(doc, 'BL', 100, 700, 60);
    drawIcon(doc, 'P', 200, 700, 60);
    drawIcon(doc, 'W', 300, 700, 60);
    drawIcon(doc, 'circle', 400, 700, 60);
    drawIcon(doc, 'square', 500, 700, 60);
  });
  pageHeader(doc, 'Icon Test');
  doc.advancedAPI((doc) => {
    drawIcon(doc, 'B', 300, 400, 512);
  });
}

module.exports.iconTest = iconTest;
