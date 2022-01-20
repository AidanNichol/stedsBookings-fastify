// const legacyRoutes = require('./legacyRoutes.js');
const { accountRoutes } = require('./accountRoutes.js');
// const authRoutes = require('../authRoutes.js');
const { walkRoutes } = require('./walkRoutes.js');
const { bankingRoutes } = require('./bankingRoutes.js');
const bookingRoutes = require('./bookingRoutes.js');
const paymentRoutes = require('./paymentRoutes.js');
const { memberRoutes } = require('./memberRoutes.js');
const updates = require('../../db/queries/updates');

async function bookingsRoutes(fastify) {
  // // fastify.register(authRoutes, { prefix: 'auth' });
  fastify.register(accountRoutes, { prefix: 'account' });
  fastify.register(walkRoutes, { prefix: 'walk' });
  fastify.register(memberRoutes, { prefix: 'member' });
  fastify.register(bankingRoutes, { prefix: 'banking' });
  fastify.register(paymentRoutes, { prefix: 'payment' });
  fastify.register(bookingRoutes, { prefix: 'booking' });
  fastify.post(`/patches`, async (request, reply) => {
    const data = await updates.withPatches(request.body);
    reply.code(201).send(data);
  });
  // fastify.register(legacyRoutes);
}
module.exports = bookingsRoutes;
