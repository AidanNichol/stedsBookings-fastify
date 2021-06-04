const models = require('../../../models');
const { todaysDate: today } = require('../../../models/scopes/dateFns');
const _ = require('lodash');

async function bankingRoutes(fastify, options) {
  // fastify.get(``, async (request, reply) => {
  //   const movies = await queries.getInfo();
  //   return movies;
  // });
  // fastify.get(`/sq/:query/:accountId/:startDate`, async (req, reply) => {
  //   const { query, ...params } = req.params;
  //   console.log(query, params);
  //   const data = await queries[query](params);
  //   return data;
  // });
  // fastify.get(`/:cmd`, async (request, reply) => {
  //   return await queries.getCommand(request.params);
  // });
  // fastify.get(`/:table/:scope`, async (request, reply) => {
  //   const { table, scope } = request.params;
  //   return await queries.getQuery(table, scope);
  // });
  // fastify.get(`/:table/:scope/:id`, async (request, reply) => {
  //   const { table, scope, id } = request.params;
  //   const data = await queries.findByPk(table, scope, id);
  //   console.log('returned', data);
  //   reply, send(data);
  // });
  // fastify.get(`/:table/:scope/:key/:id`, async (request, reply) => {
  //   const { table, scope, key, id } = request.params;
  //   return await queries.findAllByKey(table, scope, key, id);
  // });
  // fastify.get(`{/:rest/:what}`, async (request, reply) => {
  //   reply.status(404).send('bookings - url unmatched.');
  // });
  // fastify.post(`/patches`, async (request, reply) => {
  //   console.log('booking/patches', request);
  //   const data = await updates.withPatches(request.request.body);
  //   reply.code(201).send(data);
  // });
  // fastify.put(`/booking/:id`, async (request, reply) => {
  //   return await queries.updateMovie(request.params.id, request.request.body);
  // });
  // fastify.delete(`/booking/:id`, async (request, reply) => {
  //   const movie = await queries.deleteMovie(request.params.id);
  //   if (movie.length) {
  //     return {
  //       status: 'success',
  //       data: movie,
  //     };
  //   } else {
  //     throw new Error(`id:${request.params.id} can't be deleted - does not exist`);
  //   }
  // });
}
module.exports = bankingRoutes;
