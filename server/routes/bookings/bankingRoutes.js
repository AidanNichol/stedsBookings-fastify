const models = require('../../../models');
// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');

async function bankingRoutes(fastify) {
  fastify.get(`/latest`, async () => {
    return await models.Banking.findOne({
      order: ['startDate'],
      limit: 1,
    });
  });
}
module.exports = bankingRoutes;
