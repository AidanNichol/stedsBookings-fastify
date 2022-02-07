const { Op } = require('sequelize');
const models = require('../../../models');
// const { userTransactionRpt } = require('../../../ReportsPdf/userTransactionRpt2');
const { userTransactionRpt3 } = require('../../../ReportsPdf/userTransactionRpt3');
const { getUserTransactionData } = require('../../../ReportsPdf/getUserTransactionData');

const fs = require('fs');
const path = require('path');

async function accountRoutes(fastify) {
  fastify.get(`/index`, async () => {
    return await models.Account.findAll({
      attributes: [['accountId', 'id'], 'accountId', 'name', 'sortName'],
      include: [
        {
          model: models.Member,
          attributes: [
            'memberId',
            'firstName',
            'lastName',
            'shortName',
            'memberStatus',
            'deleteState',
            'suspended',
            'subscription',
          ],
        },
      ],
    });
  });

  fastify.get(`/activeBookings/:accountId/:startDate`, async (req) => {
    const account = await bookingsData({ ...req.params, endDate: 'active' });
    return account;
  });
  fastify.get(`/activePayments/:accountId/:startDate`, async (req) => {
    const payments = await paymentsData(req.params);
    return payments;
  });
  fastify.get(`/activeData/:accountId/:startDate`, async (req) => {
    let { accountId, startDate } = req.params;
    const data = await getUserTransactionData(accountId, startDate);
    return data;
  });
  // fastify.post(`/transRpt0`, async (req) => {
  //   console.log('transRpt');
  //   const data = req.body;
  //   const fileName = await userTransactionRpt(data);
  //   console.log('transRpt', fileName);
  //   return { fileName };
  // });
  fastify.post(`/transRpt`, async (req) => {
    console.log('transRpt3');
    const data = req.body;
    const fileName = await userTransactionRpt3(data);
    console.log('transRpt', fileName);
    return { fileName };
  });
  fastify.get(`/transRpt/:fileName`, async (req, res) => {
    const { fileName } = req.params;
    res.header('Content-Disposition', `inline; filename="${fileName}"`);
    const stream = fs.createReadStream(path.resolve(`documents/${fileName}`));
    res.type('application/pdf').send(stream);
  });
  // fastify.get(`/userTransactionsRpt/:accountId/:startDate/:endDate`, async (req, res) => {
  //   let { accountId, startDate, endDate } = req.params;
  //   if (endDate < startDate) startDate = endDate;
  //   let bookingsRaw = await bookingsData({ accountId, startDate });
  //   let paymentsRaw = await paymentsData({ accountId, startDate });

  //   const fileName = await userTransactionRpt(accountId, bookingsRaw, paymentsRaw);
  //   res.header('Content-Disposition', `inline; filename="${fileName}"`);
  //   const stream = fs.createReadStream(path.resolve(`documents/${fileName}`));
  //   res.type('application/pdf').send(stream);
  // });

  fastify.get(`/bookingsData/:accountId/:startDate/:endDate`, async (req) => {
    const bookings = await bookingsData(req.params);

    return bookings;
  });
  fastify.get(`/paymentsData/:accountId/:startDate/:endDate`, async (req) => {
    const payments = await paymentsData(req.params);

    return payments;
  });

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
    return res;
  });
}

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
  let where = typeof endDate === 'string' && endDate !== 'active' ? historic : active;
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
module.exports = { accountRoutes, paymentsData, bookingsData };
