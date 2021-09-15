const {
  format,
  addSeconds,
  differenceInMonths,
  // getDay,
  // addDays,
  // addWeeks,
  addMonths,
  // addYears,
  parseISO,
} = require('date-fns');
const { format: fmtFp } = require('date-fns/fp');
const formatDate = fmtFp('yyyy-MM-dd');
const formatISOdate = fmtFp("yyyy-MM-dd'T'HH:mm:ss.SSS");
exports.formatDate = formatDate;
exports.formatISOdate = formatISOdate;
const loadedDate = new Date();
exports.dispDate = (dat, base = loadedDate) => {
  const tdat = parseISO(dat);
  const fmt = differenceInMonths(base, tdat) > 6 ? 'dd MMM, yyyy' : 'dd MMM HH:mm';
  return format(tdat, fmt);
};

exports.datetimeNextSec = (oldDate, inc = 1) => {
  return formatISOdate(addSeconds(parseISO(oldDate.slice(0, -4)), inc));
};

exports.todaysDate = () => {
  let today = new Date();
  // today = parseISO('2020-03-18');
  return formatDate(today);
};

exports.getTimestamp = function getTimestamp() {
  return formatISOdate(new Date());
};
exports.currentSubsYear = () => {
  let today = new Date();
  // today = parseISO('2020-03-18');

  // let tday = formatDate(today)
  let year = format(today, 'yyyy');
  // const tdy = parseISO(today());
  const lastYear = format(addMonths(today, -3), 'yyyy');
  if (lastYear < year) year = lastYear;
  console.log('currentSubsYear', year);
  return year;
};
