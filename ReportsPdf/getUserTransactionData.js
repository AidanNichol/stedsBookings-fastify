const models = require('../models/index');
const sequelize = require('sequelize');
const { Op } = sequelize;
const _ = require('lodash');

// const { paymentsData, bookingsData } = require('../server/routes/bookings/accountRoutes');
function findExtra(coll, other, key) {
  let required = _.uniq(coll.flatMap((b) => b.Allocations2.map((a) => a[key])));
  return _.difference(
    required.filter((r) => r),
    other.map((p) => p[key]),
  );
}

async function getUserTransactionData(accountId, startDate) {
  let account = await models.Account.findByPk(accountId, {
    include: { model: models.Member, attributes: ['memberId'] },
  });
  account = account.get({ plain: true });
  const members = account.Members.map((m) => m.memberId);
  let bookings = await bookingsData3({ members, startDate });
  // let earliestPayment = getEarliest(bookingsRaw, (a) => a.paymentId);
  let refunds = await refundsData3({ accountId, startDate });
  // const paymentStart = earliestPayment.substr(0, 10);
  let payments = await paymentsData3({ accountId, startDate });
  // [, paymentsRaw] = _.partition(paymentsRaw, (p) => /^.X/.test(p.req));
  // for (const refund of refundsRaw) {
  //   refund.Allocation2 = await refundsData3(refund.paymentId);
  //   refund.Allocation = refund.Allocation2;
  // }

  const extraPaymentIds = findExtra(refunds, payments, 'paymentId');
  if (extraPaymentIds.length !== 0) {
    const extraPayments = await paymentsData3({ accountId, list: extraPaymentIds });
    payments = [...payments, ...extraPayments];
  }
  let forever = true;
  do {
    const extraPaymentIds = findExtra(bookings, payments, 'paymentId');
    if (extraPaymentIds.length > 0) {
      const extraPayments = await paymentsData3({ accountId, list: extraPaymentIds });
      payments = [...payments, ...extraPayments];
    }
    const extraBookingIds = findExtra(payments, bookings, 'bookingId');
    if (extraBookingIds.length === 0) break;

    const extraBookings = await bookingsData3({ members, list: extraBookingIds });
    bookings = [...bookings, ...extraBookings];
  } while (forever);

  // let earliestBooking = getEarliest(
  //   paymentsRaw.Payments,
  //   (a) => (a.Booking || {}).createdAt || a.refundId,
  // );
  return { account, bookings, payments, refunds }; //aidan
}

async function bookingsData3({ members, startDate, list }) {
  if (startDate === '0000-00-00') return {};
  // try {
  console.log('bookingsData', { members, startDate, list });
  const secondary = list
    ? { bookingId: list }
    : {
        [Op.or]: [
          { bookingId: { [Op.gte]: 'W' + startDate } },
          { owing: { [Op.gt]: 0 } },
        ],
      };

  let res = await models.Booking.findAll({
    model: models.Booking,
    required: false,
    order: ['createdAt'],
    where: { memberId: members, ...secondary },
    include: [
      {
        model: models.BookingLog,
        attributes: ['id', 'req', 'dat', 'fee', 'late'],
        // include: { model: models.Allocation, required: false },
      },
      {
        model: models.Allocation,
        required: false,
        order: ['paymentId'],
        include: [{ model: models.Payment }],
      },
      { model: models.Walk, attributes: ['venue'] },
      { model: models.Member, attributes: ['shortName'] },
    ],
  });

  // res = res.map((b) => b.get({ plain: true }));
  res = res.map((r) => {
    let p = r.get({ plain: true });
    return { ...p, ...reducedAllocations(p.Allocations, 'paymentId') };
  });

  return res;
}

async function paymentsData3({ accountId, startDate, list }) {
  const secondary = _.isArray(list)
    ? { paymentId: list }
    : {
        [Op.or]: [{ paymentId: { [Op.gte]: startDate } }, { available: { [Op.gt]: 0 } }],
      };

  let res = await models.Payment.findAll({
    order: ['paymentId'],
    where: { accountId: accountId, ...secondary },
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Booking,
        attributes: ['createdAt'],
        required: false,
      },
    },
  });
  res = res.map((r) => {
    let p = r.get({ plain: true });
    return { ...p, ...reducedAllocations(p.Allocations, 'bookingId') };
  });
  return res;
}
async function refundsData3({ accountId, startDate, list }) {
  const secondary = _.isArray(list) ? { [Op.in]: list } : { [Op.gte]: startDate };

  let res = await models.Refund.findAll({
    order: ['refundId'],
    attributes: ['refundId', 'amount', 'req', 'available', 'accountId'],
    where: { accountId: accountId, refundId: secondary },
    include: {
      model: models.Allocation,
      required: false,
    },
  });
  res = res.map((r) => {
    let p = r.get({ plain: true });
    p.Allocations2 = p.Allocations;
    return p;
  });
  return res;
}
// async function refundsData3(refundId) {
//   let res = await models.Allocation.findAll({
//     where: { refundId },
//   });
//   res = res.map((a) => a.get({ plain: true }));
//   return res;
// }
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃             reduced Allocations                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
*/
function reducedAllocations(allocations, key) {
  if (allocations.length === 0) return { Allocations2: allocations };
  let allocs = _.groupBy(allocations, key);
  allocs = _.values(allocs).map((allocs) => {
    allocs = _.sortBy(allocs, 'id');
    let amount = allocs.reduce((acc, all) => acc + all.amount, 0);
    return { ..._.last(allocs), amount };
  });
  return { Allocations2: allocs };
}

exports.getUserTransactionData = getUserTransactionData;
