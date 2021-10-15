const models = require('../models');
// const { Op } = require('sequelize');
const getData = async () => {
  let payments = await models.Payment.findAll({
    order: ['paymentId'],
    // where: { accountId: 'A2034' },

    attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],

    include: [
      {
        model: models.Account,
      },
      {
        model: models.Allocation,
        required: false,
        include: {
          model: models.Booking,
          required: false,
          include: [
            {
              model: models.Walk,
              attributes: ['venue'],
            },
            {
              model: models.Member,
              attributes: ['accountId', 'memberId', 'firstName', 'lastName'],
            },
            {
              model: models.BookingLog,
              attributes: ['id', 'req', 'dat', 'fee', 'late'],
              include: { model: models.Allocation, required: false },
            },
          ],
        },
      },
      // {
      //   model: models.Member,
      //   attributes: ['accountId', 'memberId', 'firstName', 'lastName'],
      // },
    ],
  });
  for (let pay of payments) {
    pay = pay.get({ plain: true });
    let available = pay.amount;
    for (const alloc of pay.Allocations) {
      available -= alloc.amount;
      const member = alloc.Booking.Member;
      if (member.accountId !== pay.accountId) {
        console.log(
          'MisMatched payment/allocation',
          pay.paymentId,
          pay.Account.accountId,
          pay.Account.name,
          member.accountId,

          member.firstName,
          member.lastName,
          alloc.Booking.bookingId,
        );
      }
    }
    if (available !== pay.available) {
      console.log('bad available', pay.accountId, pay.available, available);
    }
  }

  const bookings = await models.Booking.findAll({
    // where: { owing: { [Op.gt]: 0 } },
    include: [
      { model: models.Allocation, required: false },
      { model: models.Member },
      {
        model: models.BookingLog,
        // where: { fee: { [Op.ne]: 0 } },
        attributes: ['id', 'req', 'dat', 'fee', 'late'],
        include: { model: models.Allocation, required: false },
      },
    ],
  });
  for (let bkng of bookings) {
    bkng = bkng.get({ plain: true });
    let { owing, fee, bookingId, status } = bkng;
    let name = bkng.Member.fullName;

    let paid = 0;
    for (const alloc of bkng.Allocations) {
      paid += alloc.amount;
    }
    if ((bkng.status === 'B' || bkng.status === 'BLZ') && fee !== 8) {
      console.log('bad fee', name, bookingId, status, fee);
    }
    if (bkng.status === 'C' && fee !== 4) {
      console.log('bad fee', name, bookingId, status, fee, owing);
    }
    if ((bkng.status === 'BX' || bkng.status === 'CX') && (fee !== 0 || owing !== 0)) {
      console.log('bad fee', name, bookingId, status, fee, owing);
    }
    if (
      (bkng.status === 'W' || bkng.status === 'WX' || bkng.status === 'CX') &&
      (fee || owing)
    ) {
      console.log('bad fee', name, bookingId, status, fee);
    }
    if (status === 'BL') fee = 8;
    if (fee - paid !== owing) {
      console.log(
        'bad paid/owing',
        name,
        bookingId,
        { paid, owing, fee, status },
        bkng.Allocations,
      );
    }
    if (paid < 0 || fee < 0 || owing < 0) {
      console.log('negative values', name, bookingId, { paid, owing, fee, status });
    }
  }
  const t = await models.sequelize.transaction();

  const paymentId = '2021-09-29T18:46:24.199';
  let aNo = await models.Allocation.destroy({ where: { paymentId }, transaction: t });
  let pNo = await models.Payment.destroy({ where: { paymentId }, transaction: t });
  await t.commit();
  console.log(pNo, aNo);
};
// const payments = getData();
getData();
