const sequelize = require('sequelize');
const Op = sequelize.Op;
const models = require('../../../models');
const { todaysDate: today } = require('../../../models/scopes/dateFns');
const _ = require('lodash');
var { EventEmitter, on } = require('events');

// Create an eventEmitter object
var eventEmitter = new EventEmitter();

// Create an eventEmitter object

async function walkRoutes(fastify, options) {
  // fastify.get(``, async (request, reply) => {
  //   const movies = await queries.getInfo();
  //   return movies;
  // });
  fastify.get(`/walkDayData`, async (req, reply) => {
    const { query, ...params } = req.params;
    console.log(query, params);
    const data = await queries[query](params);
    return data;
  });
  fastify.get(`/bookingCount`, async (request, reply) => {
    return bookingCount();
  });
  fastify.get('/monitorBookingCount', (request, reply) => {
    console.log('monitorBookingCount activated');
    reply.sse(
      (async function* () {
        for await (const data of on(eventEmitter, 'refreshBookingCount')) {
          // console.log('yielding', data);
          yield {
            id: 'refreshBookingCount',
            data: JSON.stringify(data.pop()),
          };
        }
      })(),
    );
  });
  // setInterval(() => {
  //   eventEmitter.emit('refreshBookingCount', { i: String(++i), other: 'what' });
  //   // console.log('some_event', String(i));
  // }, 2000);
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
module.exports = { walkRoutes, refreshBookingCount };
async function refreshBookingCount() {
  let data = await bookingCount();
  // console.log('refreshing', data);
  eventEmitter.emit('refreshBookingCount', data);
}
async function bookingCount() {
  const bCount = `
    SELECT COUNT(*) 
    FROM bookings AS booking
    WHERE
    booking.walkId = Walk.walkId`;

  let data = await models.Walk.findAll({
    where: { [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }] },
    attributes: [
      'walkId',
      'venue',
      [sequelize.literal(`(${bCount} AND booking.status = "B" )`), 'booked'],
      [sequelize.literal(`(${bCount} AND booking.status = "C" )`), 'cars'],
      [sequelize.literal(`(${bCount} AND booking.status = "W" )`), 'waiting'],
      [sequelize.literal(`(${bCount} AND booking.owing > 0 )`), 'noOwing'],
      'firstBooking',
      'longName',
      'shortName',
      'displayDate',
      'closed',
      'capacity',
      'fee',
    ],
  });
  data = data.map((w) => {
    w = w.get({ plain: true });
    w.full = w.capacity - w.booked - w.waiting <= 0;
    return w;
  });
  // console.log('booking count returning:\n', data);
  return data;
}

async function walkdayData() {
  let walk = await models.Walk.scope([
    'firstBooking',
    'firstBookingDate',
    'buslist',
  ]).findAll();
  walk = walk[0];
  let accounts = walk.Bookings.map((b) => b.Member.accountId);
  const startDate = walk.firstBooking;
  accounts = _.uniqBy(accounts);
  console.log('walkday accounts', accounts);
  // const scope = { method: ['historicData', startDate, endDate] };
  // let res = await models.Account.scope(scope).findByPk(accountId);
  const scope = { method: ['currentMinimal', startDate, today()] };
  let current = await models.Account.scope(scope).findAll({
    where: { accountId: accounts },
  });
  current = fp(current);
  current.forEach((acc) => {
    acc.credit = acc.Payments.reduce((sum, p) => sum + p.available, 0);
    delete acc.Payments;
  });
  console.log(current);
  return current;
}
function fp(item) {
  return item.get({ plain: true });
}
