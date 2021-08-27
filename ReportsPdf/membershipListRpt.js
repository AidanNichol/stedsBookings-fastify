const {
  placeBlock,
  setNoCols,
  align,
  pageHeader,
  numberPages,
  getPageDimensions,
  setPageDimensions,
} = require('./pdfSetup');

const { currentSubsYear } = require('../server/routes/bookings/dateFns');
const { jsPDF } = require('jspdf'); // will automatically load the node version const pcexp = /^([^]*)([a-pr-uwyz]{1}[a-hk-y]?[0-9]{1,2})(\s*)([0-9]{1}[abd-jlnp-uw-z]{2})$/i;
const pcexp =
  /^([^]*)([a-pr-uwyz]{1}[a-hk-y]?[0-9]{1,2})(\s*)([0-9]{1}[abd-jlnp-uw-z]{2})$/i;

const models = require('../models');
const _ = require('lodash');

// let p = getPageDimensions();
const titleSize = 16;
const memSize = 12;
const hPad = 5;
const fontSize = 10;
// setPageDimensions(297, 210);
// setNoCols(1, 3, 10, true);
// setSubHeading(titleSize);
const minFs = 8;
let x;
let doc;

let fields = [
  ['name', 98],
  ['paid', 20, 'C'],
  ['address', 150],
  ['phones', 82],
  ['memNo', 27, 'C'],
  ['email', 150],
  ['nextOfKin', 160],
  ['medical', 98],
];
let dims = {};
function setupDims(fields, p) {
  let dims = {};
  x = p.margin;
  fields.forEach(([key, sz, align = 'L']) => {
    let wd = sz - hPad;
    dims[key] = { size: sz, x, wd, align: align + 'M' };
    x += sz;
  });
  if (x !== p.col.right) console.log('column overflow', x, p.col.right);
  return dims;
}

function addPage(doc, p) {
  const showGrid = false;
  let headings = [
    'Name',
    '£',
    'Address',
    'Phone',
    'No',
    'Email',
    'Next of Kin',
    'Medical',
  ];
  pageHeader(doc, 'Membership List');
  const h = p.header.sub;
  doc.setFontSize(9);
  // doc.set;
  doc.line(h.left, h.top, h.right, h.top);
  doc.line(h.left, h.bottom, h.right, h.bottom).stroke();

  doc.setFont('helvetica', 'bold');
  headings.forEach((text, i) => {
    let name = fields[i][0];
    let { align: al, x, wd } = dims[name];
    if (al[0] === 'C') x += wd / 2;
    doc.text(text, x, h.middle, align[al]);
  });
  doc.setFont('helvetica', 'normal');

  if (showGrid) {
    for (const [name] of fields) {
      const dim = dims[name];
      doc.line(dim.x, p.col.top, dim.x, p.col.bottom);
      doc.line(dim.x + dim.wd, p.col.top, dim.x + dim.wd, p.col.bottom);
      doc.line(p.col.right, p.col.top, p.col.rightcol.bottomend);
    }
    doc.stroke();
  }
}

function showSubs(mem) {
  const statusMap = { Member: '', HLM: 'hlm', Guest: 'gst', '?': '' };
  const subsMap = {
    ok: { color: 51 },
    due: { color: '#ffA500', fontWeight: 'bold' },
    late: { color: '#ff0000', fontWeight: 'bold' },
  };
  let stat = statusMap[mem.memberStatus || '?'];
  if (stat !== '') return [stat, {}];

  let subs = mem.subsStatus;
  // let subs = mem.subsStatus;
  stat = `${mem.subscription ? "'" + (parseInt(mem.subscription) % 100) : '---'}`;
  let atts = subsMap[subs.status];
  return [stat, atts];
}

const prepAddr = (addr) => {
  addr = addr.split('\n').join(' ');
  let result = pcexp.exec(addr);
  if (!result) return addr;
  return result[1] + result[2].toUpperCase() + ' ' + result[4].toUpperCase();
};
let members = [];

const phoneNumbers = (mem) => {
  let lines = [];
  if (mem.memberId === 'M2029') {
    console.log('2029 mobile', mem.mobile);
  }
  if (mem.phone) {
    let lines1 = mem.phone.split('/').map((l) => `H:${l}`);
    // let [fs1, lines1] = fitBox(`H:${mem.phone}`, 'phones');
    lines.push(...lines1);
    // fs = Math.min(fs, fs1);
  }
  if (mem.mobile) {
    let lines1 = mem.mobile.split('/').map((l) => `M:${l}`);
    // let [fs1, lines1] = fitBox(`H:${mem.phone}`, 'phones');
    lines.push(...lines1);

    // let [fs2, lines1] = fitBox(`M:${mem.mobile}`, 'phones');
    // lines.push(...lines1);
    // fs = Math.min(fs, fs2);
  }
  mem.phones = lines;
  let dim = dims.phones;
  let size = dim.wd / _.max(lines.map((text) => doc.getStringUnitWidth(text)));
  dim.fs = Math.min(fontSize, size);
  dim.lines = lines;
  dim.ht = lines.length;

  return lines;
};
const subsYear = currentSubsYear();
const isPaidUp = (m) => m.memberStatus !== 'Member' || m.subscription >= subsYear;

async function membershipListRpt(showAll, sortBy) {
  let p = getPageDimensions();
  setPageDimensions(297, 210, 10, 8, 5.65);
  setNoCols(1, 3, 10, true);
  dims = setupDims(fields, p);
  doc = new jsPDF('l', 'pt', 'A4');

  addPage(doc, p);
  let resp = await models.Member.findAll();
  resp = resp.map((m) => m.get({ plain: true }));
  members = _.sortBy(
    resp.filter((m) => showAll === 'Y' || isPaidUp(m)),
    [sortBy],
  );

  // let x, y;
  doc.setLineWidth(0.75);

  // const putHText = (right) => [right ? x + colWidth - hPad : x + hPad, y + titleSize / 2];
  // const putMText = (i, off = 0) => [x + hPad + off, y + titleSize + (i + 0.5) * memSize];

  doc.setTextColor('#333333').setDrawColor(51);

  for (const mem of members) {
    mem.address = prepAddr(mem.address);
    mem.phones = phoneNumbers(mem);
    mem.medical = mem.medical.replace(/,/, ', ');

    const maxLines = getLineCount(
      mem,
      ['address', 'medical', 'nextOfKin'],
      mem.phones.length,
    );
    fitBox(mem.sortName, 'name');

    const [paid, atts] = showSubs(mem);
    // < class="justify-center" style={showSubs(mem)[1]}>
    fitBox(paid, 'paid');
    dims.paid.color = atts.color;
    dims.paid.fs = fontSize * 1.2;

    blockText(mem.address, 'address', maxLines);
    // fitMultiLineBox(mem.phones, 'phones');
    fitBox(mem.memberId.substr(1), 'memNo');
    fitBox(mem.email, 'email');
    blockText(mem.nextOfKin, 'nextOfKin', maxLines);
    blockText(mem.medical, 'medical', maxLines);

    const noLines = _.max([..._.map(dims, 'ht'), 2]);
    let height = noLines * memSize;
    let { left, right, top, bottom, middle, pageBreak } = placeBlock(height);
    if (pageBreak) addPage(doc, p);
    doc.line(left, bottom, right, bottom).stroke();
    for (const [name] of fields) {
      let y1 = middle;
      let { fs, align: al, lines, x, wd, color } = dims[name];
      if (al[0] === 'C') x += wd / 2;
      if (_.isArray(lines) && lines.length > 1) {
        al = al[0] + 'T';
        y1 = top + ((noLines - lines.length) / 2) * memSize;
      }
      doc.setFontSize(fs);
      if (color) {
        doc.setFont('helvetica', 'bold');

        doc.setTextColor(color);
      }
      doc.text(lines, x, y1, align[al]);
      if (color) {
        doc.setFont('helvetica', 'normal');

        doc.setTextColor(51);
      }
    }
  }
  doc.deletePage(1);
  numberPages(doc);
  let pdf = `membershipList.pdf`;
  doc.save(`documents/${pdf}`); // will save the file in the current working directory
  return pdf;
}
function getLineCount(mem, codes, count) {
  doc.setFontSize(minFs);
  for (const field of codes) {
    const len = doc.splitTextToSize(mem[field], dims[field].wd).length;
    count = Math.max(count, len);
  }
  return count;
}
// function datacell(text, name) {
//   let dim = dims[name];
//   let fs = fontSize + 1;
//   let lines = ['', '', ''];
//   while (lines.length <= 2) {
//     fs -= 1;
//     doc.setFontSize(fs);

//     lines = doc.splitTextToSize(text, dim.wd);
//   }

//   doc.text(lines, dim.x, y), align[dim.align];
//   maxHeight = Math.max(maxHeight, lines.length);
// }
function blockText(text, name, max) {
  let dim = dims[name];
  let fs = fontSize + 0.5;
  let lines = ['', '', '', '', '', ''];
  while (lines.length > max) {
    fs -= 0.5;
    doc.setFontSize(fs);

    lines = doc.splitTextToSize(text, dim.wd);
  }
  dim.fs = fs;
  dim.lines = lines;
  dim.ht = lines.length;
  return [fs, lines];
}
function fitBox(text, name) {
  let dim = dims[name];
  let size = dim.wd / doc.getStringUnitWidth(text);
  let fs = Math.min(fontSize, size);
  let lines = [text];
  if (fs < minFs) {
    [fs, lines] = blockText(text, name, 2);
  }
  dim.fs = fs;
  dim.lines = lines;
  dim.ht = lines.length;
  return [fs, lines];
}

exports.membershipListRpt = membershipListRpt;
