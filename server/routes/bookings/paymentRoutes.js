const models = require('../../../models');
const { Op } = require('sequelize');

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');

async function paymentRoutes(fastify) {
  fastify.get(`/paymentsMade`, async () => {
    return await models.Payment.findAll({
      order: ['paymentId'],
      where: {
        [Op.and]: {
          paymentId: { [Op.gt]: '2019-04-01' },
          bankingId: { [Op.is]: null },
          req: { [Op.startsWith]: 'P' },
        },
      },
      required: false,
      attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],
      include: {
        model: models.Allocation,
        required: false,
        include: {
          model: models.Booking,
          include: {
            model: models.BookingLog,
            limit: 1,
            where: { fee: { [Op.ne]: 0 } },
            attributes: ['id', 'req', 'dat', 'fee', 'late'],
            include: { model: models.Allocation, required: false },
          },
        },
      },
    });
  });
}
module.exports = paymentRoutes;
