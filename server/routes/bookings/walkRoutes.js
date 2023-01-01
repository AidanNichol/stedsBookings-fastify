const sequelize = require('sequelize');
const Op = sequelize.Op;
const models = require('../../../models');
const { todaysDate: today } = require('./dateFns');
const packageJson = require('../../../package.json');
var { eventEmitter } = require('../../eventEmitter');

const version = packageJson.version;

const _ = require('lodash');
// const { shortName, shortCode } = require('../../../models/walk');

// Create an eventEmitter object

// var { eventEmitter } = require('../../eventEmitter');

async function walkRoutes(fastify) {
  // fastify.get(``, async (request, reply) => {
  //   const movies = await queries.getInfo();
  //   return movies;
  // });
  fastify.get('/', async () => {
    return {
      node: process.versions.node,
      version,
    };
  });
  fastify.get('/index', async () => {
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
  fastify.get('/closeWalk/:walkId', async (req) => {
    const { walkId } = req.params;
    await models.Walk.update({ closed: true }, { where: { walkId: walkId } });
    eventEmitter.emit('change_event', { event: 'reload' });
  });
  fastify.get('/firstBooking', async () => {
    console.log('today', today());
    fastify.log.info(`today ${today()}`);
    const first = await models.Walk.findOne({
      order: ['walkId'],
      limit: 1,
      where: {
        firstBooking: { [Op.lte]: today() },
        closed: { [Op.ne]: true },
      },
    });
    fastify.log.info(`firstBooking ${JSON.stringify(first)}`);
    return first;
  });
  fastify.get('/allBuslists', async () => {
    return await allBuslists();
  });
  fastify.get('/WLindex', async () => {
    let data = await allBuslists();
    return await numberWL(data);
  });
  fastify.get('/walkdayData', async () => {
    const data = walkdayData();
    return data;
  });
  fastify.get('/bookingCount0', async () => {
    return bookingCount();
  });
  fastify.get('/bookingCount', async () => {
    return bookingCount2();
  });
  fastify.get('/bookingCount2', async () => {
    return bookingCount2();
  });
}
module.exports = { walkRoutes, bookingCount, walkdayData, allBuslists, numberWL };
// let timeoutId;
// function refreshBookingCount() {
//   if (timeoutId) clearTimeout(timeoutId);
//   timeoutId = setTimeout(async () => {
//     console.log('refreshing', 'BookingCount');
//     let data = await bookingCount();
//     // console.log('emmitting', data);
//     eventEmitter.emit('change_event', { event: 'refreshBookingCount', ...data });
//     timeoutId = null;
//   }, 100);
// }
async function bookingCount() {
  const bCount = `
    SELECT COUNT(*) 
    FROM bookings AS booking
    WHERE
    booking.walkId = Walk.walkId`;
  console.log('-----------bookingCount-----------------------');
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
async function bookingCount2() {
  console.log('-----------bookingCount2-----------------------');

  let data = await models.Walk.findAll({
    where: { firstBooking: { [Op.lte]: today() }, closed: false },

    include: [
      {
        model: models.Booking,
        where: { status: ['B', 'C', 'W'] },
        attributes: ['status'],
        required: false,
      },
    ],
  });
  data = data.map((w) => {
    let { Bookings, ...rest } = w.get({ plain: true });
    let bookings = _.mapValues(_.groupBy(Bookings, 'status'), (v) => v.length);
    let { B: booked = 0, C: cars = 0, W: waiting = 0 } = bookings;
    w = { ...rest, booked, cars, waiting };
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
        attributes: ['memberId', 'firstName'],
        include: [
          {
            model: models.Booking,
            attributes: ['owing', 'status', 'walkId', 'bookingId'],
            where: {
              [Op.or]: [
                { bookingId: { [Op.gte]: `W${startDate}` } },
                { updatedAt: { [Op.gte]: startDate } },
                { owing: { [Op.gt]: 0 } },
              ],
            },
            include: [{ model: models.Walk, attibutes: ['shortCode', 'venue', 'fee'] }],
          },
        ],
      },
    ],
  });
  current = current.map((a) => a.get({ plain: true }));
  return current;
}

async function allBuslists() {
  let data = await models.Walk.findAll({
    attributes: ['walkId', 'venue', 'capacity', 'displayDate', 'longName', 'shortCode'],
    include: {
      model: models.Booking,
      required: false,
      attributes: ['memberId', 'status', 'updatedAt', 'annotation'],
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
  });
  return [WLindex];
}
