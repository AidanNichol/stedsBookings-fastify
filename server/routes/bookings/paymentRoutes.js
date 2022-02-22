const models = require('../../../models');
const { Op } = require('sequelize');
const { paymentsReceivedRpt } = require('../../../ReportsPdf/paymentsReceivedRpt');
const fs = require('fs');
const path = require('path');

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');

async function paymentRoutes(fastify) {
  fastify.get(`/paymentsReceivedRpt`, async (req, res) => {
    let fileName = await paymentsReceivedRpt();
    console.log('about to send members report');
    res.header('Content-Disposition', `inline; filename="${fileName}"`);
    const stream = fs.createReadStream(path.resolve(`documents/${fileName}`));
    res.type('application/pdf').send(stream);
  });
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
        order: ['updatedAt'],
        required: false,
        include: {
          model: models.Booking,
          include: {
            model: models.BookingLog,
            limit: 1,
            where: { fee: { [Op.ne]: 0 } },
            attributes: ['id', 'req', 'dat', 'fee', 'late'],
            // include: { model: models.Allocation, required: false },
          },
        },
      },
    });
  });
}
module.exports = paymentRoutes;
