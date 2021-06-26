const models = require('../../../models');
const { Op } = require('sequelize');

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');

async function bookingRoutes(fastify) {
  fastify.get(`/buslist/:walkId`, async (request) => {
    return await models.Booking.findAll({
      attributes: ['memberId', 'status', 'updatedAt'],
      where: { walkId: request.params.walkId, status: ['B', 'C', 'W'] },
      include: {
        model: models.Member,
        attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
      },
    });
  });
  fastify.get(`/owing`, async () => {
    return await models.Booking.findAll({
      where: { owing: { [Op.gt]: 0 } },
      include: [
        {
          model: models.BookingLog,
          where: { fee: { [Op.ne]: 0 } },
          attributes: ['id', 'req', 'dat', 'fee', 'late'],
          include: { model: models.Allocation, required: false },
        },
      ],
    });
  });
}
module.exports = bookingRoutes;
