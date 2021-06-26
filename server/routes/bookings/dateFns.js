const {
  format,
  addSeconds,
  differenceInMonths,
  // getDay,
  // addDays,
  // addWeeks,
  // addMonths,
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

let today = new Date();
today = parseISO('2020-03-18');
exports.todaysDate = () => {
  return formatDate(today);
};

exports.getTimestamp = function getTimestamp() {
  return formatISOdate(new Date());
};

// export const DateStore = types
//   .model({
//     today: types.optional(types.Date, new Date()),
//     testing: types.optional(types.boolean, false)
//   })
//   .views(self => ({
//     datetimePlus1(oldDate, inc = 1) {
//       return formatISOdate(addMilliseconds(parseISO(oldDate), inc));
//     },

//     dispDate(dat) {
//       return dispDate(dat, self.Today);
//     },

//     get dayNo() {
//       return getDay(self.today);
//     },

//     get todaysDate() {
//       return formatDate(self.today);
//     },
//     getLogTime(today = new Date()) {
//       return formatISOdate(today);
//     },

//     get now() {
//       return format(new Date(), 'yyyy-MM-dd HH:mm');
//     },

//     get prevDate() {
//       return formatDate(addDays(self.today, -55));
//     },

//     get lastAvailableDate() {
//       return formatDate(addDays(self.today, 59));
//     },

//     get logTime() {
//       return formatISOdate(new Date());
//     },
//     datetimeIsRecent(datStr) {
//       return self.datetimeIsToday(datStr);
//     },
//     datetimeIsToday(datStr) {
//       return datStr.substr(0, 10) === self.todaysDate; // in the same day
//     },

//     datePlusNweeks(dat, n = 4) {
//       return formatDate(addWeeks(parseISO(dat), n));
//     },
//     datePlusNyears(dat, n) {
//       return formatDate(addYears(dat ? parseISO(dat) : new Date(), n));
//     },
//     datePlusNmonths(dat, n) {
//       return formatDate(addMonths(parseISO(dat), n));
//     },
//     datePlusNdays(dat, n) {
//       return formatDate(addDays(new Date(dat), n));
//     }
//   }))
//   .actions(self => ({
//     setNewDate(newDate, testing = false) {
//       self.today = typeof newDate === 'string' ? new Date(newDate) : newDate;
//       self.testing = testing;
//     }
//   }));
