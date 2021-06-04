const models = require('../../../models');
const { todaysDate: today } = require('../../../models/scopes/dateFns');
const _ = require('lodash');
const command = {
  status: { table: 'Walk', scope: ['active', 'bookingCount'] },
  banking: { table: 'Banking', scope: 'couchDB' },
  bookingsUnpaid: {
    table: 'Booking',
    scope: ['owing', 'details', 'includeMember', 'includeAccount'],
  },
  creditsOwed: { table: 'Account', scope: ['creditsOwed'] },
  allBuslists: { table: 'Walk', scope: ['active', 'buslist'] },
  WLindex: { table: 'Walk', scope: ['active', 'buslist'], postProcess: numberWL },
  nextBusAccounts: {
    table: 'Walk',
    scope: ['firstBooking', 'firstBookingDate', 'buslist'],
  },
};

async function getInfo() {
  const info = {};
  const { Walk, Booking, Member, Account, Payment } = models;
  info.bookings = await Booking.count({});
  info.walks = await Walk.count({});
  info.payments = await Payment.count();
  info.accounts = await Account.count();
  info.members = await Member.count();
  return info;
}

async function getQuery(table, scope) {
  try {
    console.log('getQuery', { table, scope });
    return await models[table].scope(scope).findAll();
  } catch (error) {
    let { message, name, DatabaseError, sql } = error;

    console.error('error', { message, name, DatabaseError, sql });
    return { error: { message, name, DatabaseError } };
  }
}
async function findByPk(table, scope, id) {
  try {
    console.log('findByPk', { table, scope, id });
    let res;
    res = await models[table].scope(scope).findByPk(id);
    console.log(res);
    return res;
  } catch (error) {
    let { message, name, DatabaseError, sql } = error;

    console.error('error', { message, name, DatabaseError, sql });
    return { error: { message, name, DatabaseError } };
  }
}
async function findAllByKey(table, scope, key, id) {
  try {
    console.log('findAllByKey', { table, scope, id });
    return await models[table].scope(scope).findAll({ where: { [key]: id } });
  } catch (error) {
    let { message, name, DatabaseError, sql } = error;

    console.error('error', { message, name, DatabaseError, sql });
    return { error: { message, name, DatabaseError } };
  }
}
async function walkdayData() {
  let walk = await getCommand({ cmd: 'nextBusAccounts' });
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
  console.log(fp(current));
  return current;
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
    const current2 = fp(current);
    current = fp(current);
    console.log('currentData returned', current2);
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
async function getCommand(params) {
  const { table, scope, postProcess } = command[params.cmd];
  console.log('getCommand', table, scope);
  let res = await models[table].scope(scope).findAll();
  if (postProcess) res = postProcess(res);
  return res;
}

module.exports = {
  getInfo,
  getQuery,
  getCommand,
  findByPk,
  findAllByKey,
  activeData,
  currentData,
  historicData,
  walkdayData,
};
