const models = require('../../../models');
const { todaysDate: today } = require('../../../models/scopes/dateFns');
const _ = require('lodash');

async function accountRoutes(fastify, options) {
  fastify.get(`/activeData/:accountId/:startDate`, async (req, reply) => {
    const data = await activeData(req.params);

    return data;
  });
  fastify.get(`/historicData/:accountId/:startDate/:endDate`, async (req, reply) => {
    const data = await historicData(req.params);

    return data;
  });
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
module.exports = accountRoutes;

async function activeData({ accountId, startDate }) {
  try {
    console.log('activeData', { accountId, startDate });
    const historic = await historicData({ accountId, startDate });
    const current = await currentData({ accountId, startDate });
    const account = { ...fp(historic), ...current };
    return account;
  } catch (error) {
    let { message, name, DatabaseError, sql } = error;

    console.error('error in query: activeData', { message, name, DatabaseError, sql });
    return { error: { message, name, DatabaseError } };
  }
}
async function historicData({ accountId, startDate, endDate }) {
  try {
    console.log('historicData', { accountId, startDate, endDate });
    const scope = { method: ['historicData', startDate, endDate] };
    let res = await models.Account.scope(scope).findByPk(accountId);
    console.log('historicData', res);
    return res;
  } catch (error) {
    let { message, name, DatabaseError, sql, stack } = error;

    console.error('error in query: historicData', {
      message,
      name,
      DatabaseError,
      sql,
      stack,
    });
    throw new Error({ message, name, DatabaseError });
  }
}
async function currentData({ accountId, startDate }) {
  try {
    console.log('currentData', { accountId, startDate });
    const scope = { method: ['currentData', startDate] };
    let current = await models.Account.scope(scope).findByPk(accountId);
    // const current2 = fp(current);
    current = current.get({ plain: true });
    console.log('currentData returned', current);
    current.Bookings = current.Members.reduce((arr, m) => {
      let bookings = m.Bookings;
      bookings.forEach((b) => {
        b.BookingLogs.forEach((log) => {
          log.name = m.shortName;
          log.venue = b.Walk.venue;
          if (b.fee === 0) log.fee = 0;
        });
      });
      delete m.Bookings;
      return [...arr, ...bookings];
    }, []);
    console.log('currentData', current);
    return current;
  } catch (error) {
    let { message, name, stack } = error;

    console.error('error in query: currentData', { message, name, stack });
    throw new Error({ query: 'currentData', message, name, stack });
  }
}
function fp(item) {
  return JSON.parse(JSON.stringify(item));
}
