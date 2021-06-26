const { Op } = require('sequelize');
const models = require('../../../models');
// const { todaysDate: today } = require('../../../models/scopes/dateFns');
// const _ = require('lodash');

async function accountRoutes(fastify) {
  fastify.get(`/index`, async () => {
    return await models.Account.findAll({
      attributes: [['accountId', 'id'], 'accountId', 'name', 'sortName'],
      include: [
        {
          model: models.Member,
          attributes: ['memberId', 'firstName', 'lastName', 'shortName'],
        },
      ],
    });
  });
  // fastify.get(`/activeData/:accountId/:startDate`, async (req, reply) => {
  //   const data = await activeData(req.params);

  //   return data;
  // });

  fastify.get(`/activeBookings/:accountId/:startDate`, async (req) => {
    const account = await bookingsData({ ...req.params, endDate: 'active' });
    return account;
  });
  fastify.get(`/activePayments/:accountId/:startDate`, async (req) => {
    const payments = await paymentsData(req.params);
    return payments;
  });
  // fastify.get(`/historicData/:accountId/:startDate/:endDate`, async (req, reply) => {
  //   const data = await historicData(req.params);

  //   return data;
  // });
  fastify.get(`/bookingsData/:accountId/:startDate/:endDate`, async (req) => {
    const bookings = await bookingsData(req.params);

    return bookings;
  });
  fastify.get(`/paymentsData/:accountId/:startDate/:endDate`, async (req) => {
    const payments = await paymentsData(req.params);

    return payments;
  });
  // fastify.get(`/creditsOwed`, async (req, reply) => {
  //   let res = 'routed';
  //   return res;
  // });

  fastify.get(`/creditsOwed`, async () => {
    let res = await models.Payment.findAll({
      order: ['paymentId'],
      where: { available: { [Op.gt]: 0 } },
      attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],
      include: [
        models.Account,
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
              { model: models.Member, attributes: ['accountId', 'shortName'] },
              {
                model: models.BookingLog,
                attributes: ['id', 'req', 'dat', 'fee', 'late'],
                include: { model: models.Allocation, required: false },
              },
            ],
          },
        },
      ],
    });
    // let res='routed'
    return res;
  });
}
module.exports = accountRoutes;

async function bookingsData({ accountId, startDate, endDate }) {
  if (startDate === '0000-00-00') return {};
  // try {
  console.log('bookingsData', { accountId, startDate, endDate });

  const active = {
    [Op.or]: [
      { bookingId: { [Op.gte]: 'W' + startDate } },
      { updatedAt: { [Op.gte]: startDate } },
      { owing: { [Op.gt]: 0 } },
    ],
  };
  const historic = {
    [Op.and]: [
      { bookingId: { [Op.gte]: 'W' + endDate } },
      { bookingId: { [Op.lte]: 'W' + startDate } },
      { owing: 0 },
    ],
  };
  let where = endDate === 'active' ? active : historic;
  let res = await models.Account.findByPk(accountId, {
    attributes: ['accountId', 'name'],
    include: [
      {
        model: models.Member,
        attributes: ['memberId', 'firstName', 'lastName', 'shortName'],
        // exclude: { attributes: ['createdAt', 'address'] },
        include: [
          {
            model: models.Booking,
            required: false,
            order: ['walkId'],
            where,
            include: [
              // {
              //   model: models.Walk,
              //   attributes: ['venue', 'fee', 'bookable', 'firstBooking', 'closed'],
              // },
              {
                model: models.BookingLog,
                attributes: ['id', 'req', 'dat', 'fee', 'late'],
                include: { model: models.Allocation, required: false },
              },
              {
                model: models.Allocation,
                required: false,
                include: [{ model: models.Payment }],
              },
            ],
          },
        ],
      },
    ],
  });

  res = res.get({ plain: true });
  console.log('bookingsData', res);
  return res;
  // } catch (error) {
  //   let { message, name, DatabaseError, sql, stack } = error;

  //   console.error('error in query: historicBookings', {
  //     message,
  //     name,
  //     DatabaseError,
  //     sql,
  //     stack,
  //   });
  //   throw new Error({ message, name, DatabaseError });
  // }
}
async function paymentsData({ accountId, startDate }) {
  let res = await models.Account.findByPk(accountId, {
    attributes: ['accountId', 'name'],
    include: [
      {
        model: models.Payment,
        order: 'paymentId',
        required: false,
        // attributes: ['paymentId', 'amount', 'req', 'available'],
        include: {
          model: models.Allocation,
          required: false,
          include: {
            model: models.Refund,
            order: 'refundId',
            required: false,
          },
        },
        where: {
          [Op.or]: [
            { paymentId: { [Op.gte]: startDate } },
            { updatedAt: { [Op.gte]: startDate } },
            { available: { [Op.gt]: 0 } },
          ],
        },
      },
    ],
  });
  res = res.get({ plain: true });
  return res;
}
// async function activeData2({ accountId, startDate }) {
//   // try {
//   console.log('activeData', { accountId, startDate });
//   const bookings = await bookingsData({ accountId, startDate, endDate: 'active' });
//   const payments = await paymentsData({ accountId, startDate });
//   const account = { bookings, payments };
//   return account;
//   // } catch (error) {
//   //   let { message, name, DatabaseError, sql } = error;

//   //   console.error('error in query: activeData', { message, name, DatabaseError, sql });
//   //   return { error: { message, name, DatabaseError } };
//   // }
// }
// async function activeBookings({ accountId, startDate }) {
//   // try {
//   console.log('activeData', { accountId, startDate });
//   const bookings = await bookingsData({ accountId, startDate, endDate: 'active' });

//   return account;
//   // } catch (error) {
//   //   let { message, name, DatabaseError, sql } = error;

//   //   console.error('error in query: activeData', { message, name, DatabaseError, sql });
//   //   return { error: { message, name, DatabaseError } };
//   // }
// }
// async function activeData2({ accountId, startDate }) {
//   // try {
//   console.log('activeData', { accountId, startDate });
//   const bookings = await bookingsData({ accountId, startDate, endDate: 'active' });
//   const payments = await paymentsData({ accountId, startDate });
//   const account = { bookings, payments };
//   return account;
//   // } catch (error) {
//   //   let { message, name, DatabaseError, sql } = error;

//   //   console.error('error in query: activeData', { message, name, DatabaseError, sql });
//   //   return { error: { message, name, DatabaseError } };
//   // }
// }
// async function activeData({ accountId, startDate }) {
//   try {
//     console.log('activeData', { accountId, startDate });
//     const historic = await historicData({ accountId, startDate });
//     const current = await currentData({ accountId, startDate });
//     const account = { ...fp(historic), ...current };
//     return account;
//   } catch (error) {
//     let { message, name, DatabaseError, sql } = error;

//     console.error('error in query: activeData', { message, name, DatabaseError, sql });
//     return { error: { message, name, DatabaseError } };
//   }
// }
// async function historicData({ accountId, startDate, endDate }) {
//   try {
//     console.log('historicData', { accountId, startDate, endDate });
//     const scope = { method: ['historicData', startDate, endDate] };
//     let res = await models.Account.scope(scope).findByPk(accountId);
//     console.log('historicData', res);
//     return res;
//   } catch (error) {
//     let { message, name, DatabaseError, sql, stack } = error;

//     console.error('error in query: historicData', {
//       message,
//       name,
//       DatabaseError,
//       sql,
//       stack,
//     });
//     throw new Error({ message, name, DatabaseError });
//   }
// }
// async function currentData({ accountId, startDate }) {
//   try {
//     console.log('currentData', { accountId, startDate });
//     const scope = { method: ['currentData', startDate] };
//     let current = await models.Account.scope(scope).findByPk(accountId);
//     // const current2 = fp(current);
//     current = current.get({ plain: true });
//     console.log('currentData returned', current);
//     current.Bookings = current.Members.reduce((arr, m) => {
//       let bookings = m.Bookings;
//       bookings.forEach((b) => {
//         b.BookingLogs.forEach((log) => {
//           log.name = m.shortName;
//           log.venue = b.Walk.venue;
//           if (b.fee === 0) log.fee = 0;
//         });
//       });
//       delete m.Bookings;
//       return [...arr, ...bookings];
//     }, []);
//     console.log('currentData', current);
//     return current;
//   } catch (error) {
//     let { message, name, stack } = error;

//     console.error('error in query: currentData', { message, name, stack });
//     throw new Error({ query: 'currentData', message, name, stack });
//   }
// }
// function fp(item) {
//   return JSON.parse(JSON.stringify(item));
// }
