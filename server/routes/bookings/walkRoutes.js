const sequelize = require('sequelize');
const Op = sequelize.Op;
const models = require('../../../models');
const { todaysDate: today } = require('./dateFns');

const _ = require('lodash');
// var { EventEmitter, on } = require('events');

// Create an eventEmitter object
var { eventEmitter, on } = require('../../eventEmitter');
// var eventEmitter = new EventEmitter();

// Create an eventEmitter object

async function walkRoutes(fastify) {
  // fastify.get(``, async (request, reply) => {
  //   const movies = await queries.getInfo();
  //   return movies;
  // });
  fastify.get(`/index`, async () => {
    return await models.Walk.findAll({
      attributes: [
        ['walkId', 'id'],
        'walkId',
        'venue',
        'fee',
        ['venue', 'name'],
        'lastCancel',
        'shortCode',
      ],
    });
  });
  fastify.get(`/firstBooking`, async () => {
    return await models.Walk.findOne({
      order: ['walkId'],
      limit: 1,
      where: {
        [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
      },
    });
  });
  fastify.get(`/allBuslists`, async () => {
    return await allBuslists();
  });
  fastify.get(`/WLindex`, async () => {
    let data = await allBuslists();
    return await numberWL(data);
  });
  fastify.get(`/walkdayData`, async () => {
    const data = walkdayData();
    return data;
  });
  fastify.get(`/bookingCount`, async () => {
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
}
module.exports = { walkRoutes, refreshBookingCount };
let timeoutId;
function refreshBookingCount() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    console.log('refreshing', 'BookingCount');
    let data = await bookingCount();
    // console.log('emmitting', data);
    eventEmitter.emit('change_event', { id: 'refreshBookingCount', ...data });
    timeoutId = null;
  }, 100);
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
    w.available = w.capacity - w.booked;
    w.full = w.capacity - w.booked - w.waiting <= 0;
    return w;
  });
  // console.log('booking count returning:\n', data);
  return data;
}

async function walkdayData() {
  let walk = await models.Walk.findOne({
    order: ['walkId'],
    limit: 1,
    where: {
      [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
    },
    attributes: [
      'walkId',
      'venue',
      'capacity',
      'displayDate',
      'longName',
      'firstBooking',
    ],
    include: {
      model: models.Booking,
      required: false,
      attributes: ['memberId', 'status', 'updatedAt'],
      where: {
        status: ['B', 'C', 'W'],
      },
      include: {
        model: models.Member,
        attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
      },
    },
  });
  // console.log('walk', walk.get({ plain: true }));
  // walk = walk[0];
  let accounts = walk.Bookings.map((b) => b.Member.accountId);
  const startDate = walk.firstBooking;
  accounts = _.uniqBy(accounts);
  // console.log('walkday accounts', accounts);
  let current = await models.Account.findAll({
    where: { accountId: accounts },
    attributes: ['accountId', 'name', 'sortName'],
    include: [
      {
        model: models.Payment,
        attributes: ['available'],
        order: 'paymentId',
        required: false,
        where: { available: { [Op.gt]: 0 } },
      },
      {
        model: models.Member,
        attributes: ['memberId', 'shortName'],
        include: [
          {
            model: models.Booking,
            attributes: ['owing', 'status', 'walkId', 'bookingId'],
            where: {
              [Op.or]: [
                { bookingId: { [Op.gte]: 'W' + startDate } },
                { updatedAt: { [Op.gte]: startDate } },
                { owing: { [Op.gt]: 0 } },
              ],
            },
          },
        ],
      },
    ],
  });
  current = fp(current);
  return current;
}

async function allBuslists() {
  let data = await models.Walk.findAll({
    attributes: ['walkId', 'venue', 'capacity', 'displayDate', 'longName'],
    include: {
      model: models.Booking,
      required: false,
      attributes: ['memberId', 'status', 'updatedAt'],
      where: {
        status: ['B', 'C', 'W'],
      },
      include: {
        model: models.Member,
        attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
      },
    },
    order: ['walkId'],
    where: {
      [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
    },
  });
  return data;
}
function numberWL(data) {
  const WLindex = {};
  data.forEach((walk) => {
    const wait = _.sortBy(
      walk.Bookings.filter((b) => b.status === 'W'),
      (b) => b.updatedAt,
    );
    wait.forEach((wB, i) => (WLindex[walk.walkId + wB.memberId] = i + 1));
    console.log('wait', wait, WLindex);
  });
  return [WLindex];
}
function fp(item) {
  return item?.get?.({ plain: true }) ?? item;
}
