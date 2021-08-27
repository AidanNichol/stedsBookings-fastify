const models = require('../../../models');
var { eventEmitter } = require('../../eventEmitter');

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');
async function bankingEvent() {
  console.log('emit refreshBanking');
  setTimeout(() => {
    eventEmitter.emit('change_event', { event: 'refreshBanking' });
  }, 1000);
}

async function bankingRoutes(fastify) {
  fastify.get(`/latest`, async () => {
    return await models.Banking.findOne({
      order: [['endDate', 'DESC']],
      limit: 1,
    });
  });
}
module.exports = { bankingRoutes, bankingEvent };
