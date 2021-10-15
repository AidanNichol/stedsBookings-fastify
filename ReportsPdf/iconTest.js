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

    doc.circle(5, 550, 2, 'F');
    doc.circle(5, 650, 2, 'F');
    doc.circle(5, 750, 2, 'F');
    doc.circle(100, 600, 2, 'F');
    doc.circle(200, 600, 2, 'F');
    doc.circle(300, 600, 2, 'F');
    doc.circle(400, 600, 2, 'F');
    drawIcon(doc, 'B', 100, 550, 60);
    drawIcon(doc, 'C', 200, 550, 60);
    drawIcon(doc, 'BX', 300, 550, 60);
    drawIcon(doc, 'CX', 400, 550, 60);
    drawIcon(doc, 'BL', 100, 650, 60);
    drawIcon(doc, 'P', 200, 650, 60);
    drawIcon(doc, 'W', 300, 650, 60);
    drawIcon(doc, 'circle', 400, 650, 60);
    drawIcon(doc, 'square', 500, 650, 60);
    drawIcon(doc, '+', 100, 750, 60);
    drawIcon(doc, '+X', 200, 750, 60);
    drawIcon(doc, 'T', 300, 750, 60);
    drawIcon(doc, 'TX', 400, 750, 60);
  });
  pageHeader(doc, 'Icon Test');
  doc.advancedAPI((doc) => {
    drawIcon(doc, 'B', 300, 400, 512);
  });
}

module.exports.iconTest = iconTest;
