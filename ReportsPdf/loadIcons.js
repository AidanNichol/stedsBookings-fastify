// import Logo from '../images/St.EdwardsLogoSimple.svg';
const _ = require('lodash');
const arcToBezier = require('svg-arc-to-cubic-bezier');
// const carSide = require('./faCarSide.js');
const car = require('./images/faCarSide.js');
const bus = require('./images/faBus.js');
const clock = require('./images/faClock.js');
const pound = require('./images/faPoundSign.js');
const circle = require('./images/faCircle.js');
const square = require('./images/faSquare.js');
const credit = require('./images/ajnCredit.js');
const treasurer = require('./images/ajnTreasurer.js');
let debug = false;

// const slash = require('./images/faSlash.js');
const iconWidth = {};
const iconHeight = {};
function loadIcons(doc) {
  [bus, car, clock, pound, square, circle, credit, treasurer].map((icn) => {
    parseIcon(icn);
  });
  loadIcon(doc, bus, '#008000', 'B');
  loadIcon(doc, bus, '#008000', 'BX', true);
  loadIcon(doc, bus, '#FFA500', 'BL', true);
  loadIcon(doc, car, '#0000ff', 'C');
  loadIcon(doc, car, '#0000ff', 'CX', true);
  loadIcon(doc, clock, '#444444', 'W');
  loadIcon(doc, clock, '#444444', 'WX', true);
  loadIcon(doc, pound, '#000000', 'P');
  loadIcon(doc, pound, '#000000', 'PX', true);
  loadIcon(doc, square, '#000000', 'square');
  loadIcon(doc, circle, '#000000', 'circle');
  loadIcon(doc, credit, '#000000', '+');
  loadIcon(doc, credit, '#000000', '+X', true);
  loadIcon(doc, treasurer, '#000000', 'T');
  loadIcon(doc, treasurer, '#000000', 'TX', true);
}
function drawIcon(doc, name, x, y, size) {
  const ht = iconHeight[name];
  const scale = size / ht;
  const ey = y - size / 2;
  const ex = x - (size * (iconWidth[name] / ht)) / 2;
  doc.advancedAPI((doc) => {
    try {
      doc.doFormObject(name, new doc.Matrix(scale, 0, 0, scale, ex, ey));
    } catch (error) {
      console.log('draw icon error', name, scale, ex, ey, error);
      doc.text(name, ex, ey);
    }
  });
}
function parseIcon(icon) {
  let { svgPathData } = icon;
  if (!_.isArray(svgPathData)) svgPathData = [svgPathData];
  icon.pdfPaths = [];
  for (const svgPath of svgPathData) {
    icon.pdfPaths.push(svgPathToPdfPath(svgPath));
  }
}
function loadIcon(doc, icon, iconColor, iconName, slash = false) {
  doc.advancedAPI((doc) => {
    const { width, height, pdfPaths } = icon;
    const scale = 512 / height;
    const shrink = height / 512;
    iconWidth[iconName] = width * scale;
    iconHeight[iconName] = height * scale;
    // let colors = ['#00ff00', '#ffff00', '#ff0000', '#0000ff'];

    let initMatrix = new doc.Matrix(scale, 0, 0, scale, 0, 0);
    new doc.Matrix(scale, 0, 0, scale, 0, 0);

    doc.beginFormObject(0, 0, width * scale, height * scale, initMatrix);
    const drawC = ['#ff0000', '#00ff00', '#0000ff'];
    let i = 0;
    for (const pdfPath of pdfPaths) {
      doc.saveGraphicsState();
      if (pdfPaths.length > 1 && i === 0) doc.setGState(new doc.GState({ opacity: 0.4 }));

      doc.setFillColor(iconColor);
      doc.setDrawColor(drawC[i++]);
      doc.path(pdfPath);
      doc.fillEvenOdd();

      debug && debugPath(doc, pdfPath);
      doc.restoreGraphicsState();
    }
    if (slash) {
      doc.setDrawColor('#ffffff').setLineWidth(100 * shrink);
      doc.line(10 * shrink, 10 * shrink, 500 * shrink, 500 * shrink);
      doc
        .setDrawColor('#ff0000')
        .setLineWidth(60 * shrink)
        .setLineCap(1);
      doc.line(10 * shrink, 10 * shrink, 500 * shrink, 500 * shrink);
    }
    doc.endFormObject(iconName);
  });
  console.log({ iconColor, iconName, slash });
}
function debugPath(doc, pdfPath) {
  let i = 0;
  for (const part of pdfPath) {
    let { op, c } = part;
    if (op !== 'h') {
      let [x, y] = c.slice(-2);
      doc.circle(x, y, 2, 'F');
      doc.text(` ${i}`, x, y);
    }
    i++;
  }
}

const svgPathToPdfPath = (svg) => {
  const parts = svg.split(/([a-z][^a-z]*)/i).filter((s) => s.length);
  let path = [];
  let debug = '';
  let x, y;

  // let seg;
  let prev = [];
  let start = null;
  // let base;

  const point = (op, c) => {
    prev = [...c];
    if (start === null || op === 'm') start = c.slice(-2);
    if (c.length > 1) [x, y] = c.slice(-2);
    path.push({ op, c: [...c], debug, x, y });
  };
  const relToAbs = (c) => c.map((v, i) => v + (i % 2 ? y : x));
  for (const part of parts) {
    let op = part.substr(0, 1);
    let c = part
      .substr(1)
      .replace(/-/g, ' -')
      .split(/[ ,]/)
      .filter((s) => s.length)
      .map((d) => Number(d));
    debug = part;
    if (op === 'M') point('m', c);
    else if (op === 'm') point('m', relToAbs(c));
    else if (op === 'V') point('l', [x, c[0]]);
    else if (op === 'v') point('l', relToAbs([0, c[0]]));
    else if (op === 'H') point('l', [c[0], y]);
    else if (op === 'h') point('l', relToAbs([c[0], 0]));
    else if (op === 'L') point('l', c);
    else if (op === 'l') point('l', relToAbs(c));
    else if (/C/i.test(op)) {
      const arcs = _.chunk(c, 6);
      for (let c of arcs) {
        if (op === 'c') c = relToAbs(c);
        // c = c.map((v, i) => v - (i % 2 ? y : x));
        point('c', c);
      }
    } else if (/S/i.test(op)) {
      const arcs = _.chunk(c, 4);
      for (let c of arcs) {
        let [, , x2, y2] = prev;
        let x1 = 2 * x - x2;
        let y1 = 2 * y - y2;
        if (op === 's') c = relToAbs(c);
        // c = c.map((v, i) => v - (i % 2 ? y : x));
        // [x, y] = [0, 0];
        c.splice(0, 0, ...[x1, y1]);
        point('c', c);
      }
    } else if (/A/i.test(op)) {
      const arcs = _.chunk(c, 7);
      for (const arc of arcs) {
        var [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, cx, cy] = arc;
        // point('l', cx, cy);
        if (op === 'a') [cx, cy] = relToAbs([cx, cy]);
        var bez = arcToBezier({
          px: x,
          py: y,
          rx,
          ry,
          xAxisRotation,
          largeArcFlag,
          sweepFlag,
          cx,
          cy,
        });

        for (const bz of bez) {
          let { x: x0, y: y0, x1, y1, x2, y2 } = bz;

          point('c', [x1, y1, x2, y2, x0, y0]);
        }
      }
    } else if (/Z/i.test(op)) {
      [x, y] = start;
      start = null;
      point('h', []);
    } else {
      console.log('unhandled', part);
    }
  }
  return path;
};

module.exports.loadIcons = loadIcons;
module.exports.drawIcon = drawIcon;
