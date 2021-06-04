const queries = require('../../db/queries/bookings');
const updates = require('../../db/queries/updates');
const legacyRoutes = require('./legacyRoutes.js');
const accountRoutes = require('./accountRoutes.js');
const { walkRoutes } = require('./walkRoutes.js');
const bankingRoutes = require('./bankingRoutes.js');
const bookingRoutes = require('./bookingRoutes.js');
const memberRoutes = require('./memberRoutes.js');

async function bookingsRoutes(fastify, options) {
  fastify.register(accountRoutes, { prefix: 'account' });
  fastify.register(walkRoutes, { prefix: 'walk' });
  fastify.register(legacyRoutes);
}
module.exports = bookingsRoutes;
