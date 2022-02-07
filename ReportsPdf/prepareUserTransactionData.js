const _ = require('lodash');

const maxString = (a, b) => (a > b ? a : b);
const expendIndex = {};
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃             reduced Expenditure Allocations       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
*/
function reducedExpenditureAllocations(allocs, lastPayment) {
  if (allocs.length === 0) return { Allocations: allocs, lastPayment };

  allocs = _.sortBy(allocs, 'paymentId');
  const lastAlloc = _.last(allocs);
  let id = lastAlloc.id.toString().padStart(5, '0');
  let paidBy = `${lastAlloc.paymentId}.${lastAlloc.bookingId}.${id}`;
  lastPayment = maxString(lastPayment, lastAlloc.paymentId.substr(0, 10));

  return { Allocations: allocs, lastPayment, paidBy };
}
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃             reduced Income Allocations            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
*/
function reducedIncomeAllocations(allocs, lastBooking) {
  if (allocs.length === 0) return { Allocations: allocs, lastBooking };

  allocs.forEach((alloc) => {
    const bookingCreatedAt = (alloc.Booking || {}).createdAt || alloc.refundId;
    let id = alloc.id.toString().padStart(5, '0');
    alloc.paidFor = `${bookingCreatedAt.substr(0, 10)}.${alloc.bookingId}.${id}`;
  });
  allocs = _.sortBy(allocs, 'paidFor');
  lastBooking = maxString(lastBooking, _.last(allocs).paidFor.substr(0, 10));

  return { Allocations: allocs, lastBooking };
}
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     add Entry                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
*/
function addEntry(entries, createdAt, type, item) {
  const day = createdAt.substr(0, 10);
  const last = type === 'income' ? 'lastBooking' : 'lastPayment';

  if (!entries[day]) entries[day] = { day, expenditure: [], income: [] };
  entries[day][type].push(item);
  entries[day][last] = maxString(entries[day][last], item[last]);
}
// const imReady = useStoreActions((a) => a.reports.imReady);
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            prepare User Transaction Data          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
*/
async function prepareUserTransactionData(
  accountId,
  bookingsRaw,
  paymentsRaw,
  refundsRaw,
) {
  let lastPayment = '';
  let entries = {};
  // let bookings = _.flatMap(bookingsRaw.Members, (m) => m.Bookings);
  // bookings = _.sortBy(bookings, 'createdAt');
  bookingsRaw.map((b) => {
    let venue = b.Walk.venue;
    let name = b.Member.shortName;
    const allocs = reducedExpenditureAllocations(b.Allocations2, lastPayment);
    lastPayment = allocs.lastPayment;
    b = { ...b, ...allocs, name, venue };
    if (b.owing) {
      b.Allocations.push({ amount: b.owing });
    }
    // console.log(b);
    addEntry(entries, b.createdAt, 'expenditure', b);
    expendIndex[b.bookingId] = b;
    return b;
  });

  let lastBooking = '';
  // let [refunds, payments] = _.partition(paymentsRaw, (p) => /^.X/.test(p.req));
  refundsRaw.forEach((p) => {
    if (!p.refundId) p.refundId = p.paymentId;
    let createdAt = p.refundId;
    // p.Allocations = _.flatMap(paymentsRaw, (pp) =>
    //   pp.Allocations.filter((a) => a.refundId !== null && a.refundId === p.refundId),
    // );
    const allocs = reducedExpenditureAllocations(p.Allocations2, lastPayment);
    lastPayment = allocs.lastPayment;
    const spent = allocs.Allocations.reduce((acc, a) => acc + a.amount, 0);

    if (spent !== p.amount - p.available) {
      console.log('refund spend error', spent, p.amount, p.available, p.paymentId);
      p.available = p.amount - spent;
    }
    p = { ...p, ...allocs, createdAt };
    addEntry(entries, createdAt, 'expenditure', p);
    expendIndex[p.refundId] = p;
  });
  paymentsRaw.forEach((p) => {
    let createdAt = p.paymentId.substr(0, 10);
    const allocs = reducedIncomeAllocations(p.Allocations2, lastBooking);
    lastBooking = allocs.lastBooking;
    const spent = allocs.Allocations.reduce((acc, a) => acc + a.amount, 0);
    if (spent !== p.amount - p.available) {
      console.log('spend error', spent, p.amount, p.available, p.paymentId);
      p.available = p.amount - spent;
    }
    p = { ...p, ...allocs, createdAt };
    if (p.available) {
      p.Allocations.push({ amount: p.available });
    }
    addEntry(entries, createdAt, 'income', p);
  });
  const sEntries = _.sortBy(_.toPairs(entries), (d) => d[0]);
  return mapEntries(sEntries);
}
function mapEntries(entries) {
  let y = 0;
  let eY = 0;
  let iY = 0;
  const lines = {};
  let breakNo = 0;
  const breaks = [];
  const entryIndex = _.fromPairs(entries);

  for (let [day, { lastPayment }] of entries) {
    if (lastPayment && entryIndex[lastPayment].lastBooking === day) {
      entryIndex[day].breakNo = breakNo;
      entryIndex[lastPayment].breakNo = breakNo;
      breaks[breakNo] = [0, 0, day, lastPayment];
      breakNo++;
    }
  }
  for (let i = 0; i < entries.length; i++) {
    let [day, { expenditure, income, breakNo, ...rest }] = entries[i];
    let expSz = 0;
    let incSz = 0;
    expenditure = _.sortBy(expenditure, 'paidBy');
    if (expenditure.length > 0) {
      if (income.length > 0) {
        y = Math.max(eY, iY);
      } else y = eY;
      expSz = 1;
      eY = y + 1;
      for (const exp of expenditure) {
        exp.y = eY;
        exp.sz = Math.max(exp.Allocations.length, 1);
        exp.Allocations.forEach(({ id }, i) => {
          if (id) lines[id] = { ...(lines[id] || {}), end: eY + i + 0.5 };
        });
        expSz += exp.sz;
        eY += exp.sz;
      }
      let brk = _.findIndex(breaks, (b) => b[2] === day);
      if (brk >= 0) {
        breaks[brk][0] = eY;
      }
    } else y = iY;
    if (income.length > 0) {
      // if (expenditure.length === 0) y = Math.max(iY, eY + 1);
      iY = y + 1;
      incSz = 1;
      for (const inc of income) {
        let allocs = _.sortBy(inc.Allocations, 'paidfor');

        inc.y = iY;
        inc.sz = Math.max(allocs.length, 1);
        allocs.forEach(({ id, amount }, i) => {
          if (id) lines[id] = { ...(lines[id] || {}), start: iY + i + 0.5, amount };
        });
        incSz += inc.sz;
        iY += inc.sz;
      }
      let brk = _.findIndex(breaks, (b) => b[3] === day);
      if (brk >= 0) {
        breaks[brk][1] = iY;
      }
    }
    entries[i] = { day, y, expSz, incSz, expenditure, income, breakNo, ...rest };
  }
  const bot = Math.max(eY, iY) + 1;
  return { bot, lines, entries, breaks };
}
exports.prepareUserTransactionData = prepareUserTransactionData;
