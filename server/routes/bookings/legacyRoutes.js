const queries = require('../../db/queries/bookings');
// const updates = require('../../db/queries/updates');
const chalk = require('chalk');
const warning = require('fastify-warning')();
warning.create('FastifyDeprecation', 'FST_LEGACY_USAGE', 'using legacy route');
async function legacyRoutes(fastify) {
  fastify.addHook('onRequest', (req, res, next) => {
    console.log('Using legacy route', chalk.black.bgYellow(req.url));
    warning.emit('FST_LEGACY_USAGE', req.url);
    next();
  });
  fastify.get(``, async () => {
    const movies = await queries.getInfo();
    return movies;
  });

  fastify.get(`/sq/:query/:accountId/:startDate`, async (req) => {
    const { query, ...params } = req.params;
    console.log(query, params);
    const data = await queries[query](params);

    return data;
  });
  fastify.get(`/sq/:query/:accountId/:startDate/:endDate`, async (req) => {
    const { query, ...params } = req.params;
    console.log(query, params);
    const data = await queries[query](params);

    return data;
  });
  fastify.get(`/:cmd`, async (request) => {
    return await queries.getCommand(request.params);
  });
  fastify.get(`/:table/:scope`, async (request) => {
    const { table, scope } = request.params;
    return await queries.getQuery(table, scope);
  });
  fastify.get(`/:table/:scope/:id`, async (request, reply) => {
    const { table, scope, id } = request.params;
    const data = await queries.findByPk(table, scope, id);
    console.log('returned', data);
    reply.send(data);
  });
  fastify.get(`/:table/:scope/:key/:id`, async (request) => {
    const { table, scope, key, id } = request.params;
    return await queries.findAllByKey(table, scope, key, id);
  });
  fastify.get(`{/:rest/:what}`, async (request, reply) => {
    reply.status(404).send('bookings - url unmatched.');
  });

  // fastify.post(`/patches`, async (request, reply) => {
  //   const data = await updates.withPatches(request.body);
  //   reply.code(201).send(data);
  // });

  fastify.put(`/booking/:id`, async (request) => {
    return await queries.updateMovie(request.params.id, request.body);
  });

  fastify.delete(`/booking/:id`, async (request) => {
    const movie = await queries.deleteMovie(request.params.id);
    if (movie.length) {
      return {
        status: 'success',
        data: movie,
      };
    } else {
      throw new Error(`id:${request.params.id} can't be deleted - does not exist`);
    }
  });
}
module.exports = legacyRoutes;
