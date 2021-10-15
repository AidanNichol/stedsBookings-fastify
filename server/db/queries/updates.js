const models = require('../../../models');
const _ = require('lodash');
const chalk = require('chalk');
var { eventEmitter } = require('../../eventEmitter');

const { bookingCount } = require('../../routes/bookings/walkRoutes.js');
const { memberIndex } = require('../../routes/bookings/memberRoutes');
// const { bankingEvent } = require('../../routes/bookings/bankingRoutes');
// async function refreshBookingCount() {
//   console.log('refreshing', 'BookingCount');
//   let data = await bookingCount();
//   // console.log('emmitting', data);
//   qEvent({ event: 'refreshBookingCount', ...data });
// }

let eventsQueue = [];
function qEvent(evnt) {
  if (_.isEqual(evnt, eventsQueue[0])) return;
  eventsQueue.push(evnt);
  console.log(chalk.white.bgRed('queued======>'), evnt, eventsQueue.length);
}
function sendEvents() {
  // console.log(chalk.white.bgGreenBright('orig queue'), eventsQueue);
  // eventsQueue = _.uniqBy(eventsQueue, _.isEqual);
  // console.log(chalk.white.bgGreenBright('uniq queue'), eventsQueue);
  while (eventsQueue.length > 0) {
    let evnt = eventsQueue.shift();
    console.log(chalk.white.bgGreen('emitting======>'), evnt, eventsQueue.length);
    eventEmitter.emit('change_event', evnt);
  }
}
// const { broadcast } = require('../sockets');
module.exports.withPatches = async (patches) => {
  console.log('patches', patches);
  const t = await models.sequelize.transaction();
  try {
    const result = [];
    let bookingChange = false;
    for (const patch of patches) {
      // patches.forEach((patch) => {
      const { op, path, value } = patch;
      const [table, key, item] = path;
      switch (table) {
        case 'Booking':
          await processItem(op, path, value, table, key, item, t);
          result.push({ op, path, patch: 'applied' });
          var memberId = key.substr(11);
          qEvent({ event: 'bookingChange', memberId });
          console.log(
            chalk.white.bgBlueBright('queueing member bookingChange'),
            path,
            key,
          );
          bookingChange = true;
          break;
        case 'Payment':
          var accountId;
          if (op === 'remove') accountId = await removePayment(key, t);
          else {
            await processItem(op, path, value, table, key, item, t);
            accountId = value.accountId;
          }
          result.push({ op, path, patch: 'applied' });
          qEvent({ event: 'bookingChange', accountId });
          break;
        case 'BookingLog':
        case 'Allocation':
        case 'Banking':
        case 'Account':
          await createItem(op, path, value, table, key, item, t);
          result.push({ op, path, patch: 'applied' });
          if (table === 'Banking') qEvent({ event: 'refreshBanking' });
          if (table === 'Account') qEvent({ event: 'refreshAccountList' });
          break;
        case 'Member':
          await processMembers(op, path, value, key, item, t);
          result.push({ op, path, patch: 'applied' });
          break;

        default:
          console.warn('skipping table :', table);
          result.push({ op, path, patch: 'skiped' });
          break;
      }
    }
    await t.commit();
    if (bookingChange) {
      var data = await bookingCount();
      // console.log('emmitting', data);
      qEvent({ event: 'refreshBookingCount', ...data });
    }
    sendEvents();
    // bookingChanged(memberId, accountId, payments);
    return result;
  } catch (error) {
    let { message, name, DatabaseError, sql, stack } = error;
    console.error('error in query: activeData', {
      message,
      name,
      DatabaseError,
      sql,
      stack,
    });
    await t.rollback();

    throw new Error({
      query: 'update with patches',
      message,
      name,
      DatabaseError,
      sql,
      stack,
    });
  }
};
const processItem = async (op, path, value, table, key, item, t) => {
  const id = table.toLowerCase() + 'Id';
  let res;
  if (item) {
    // const bkng0 = await models[table].findByPk(key);
    console.log('pre update', table, id, item, value);
    res = await models[table].update(
      { [item]: value },
      { where: { [id]: key }, transaction: t },
    );
  } else {
    console.log(`${op} ${table}`, id, key, value);
    await models[table].findOrCreate({ where: { [id]: key }, transaction: t });
    res = await models[table].update(value, { where: { [id]: key }, transaction: t });
  }
  console.log('ProcessItem res', res);

  console.log('returned', res);
  return res;
};
// function bookingChanged(memberId, accountId, payments) {
//   if (!memberId && !accountId) return;
//   console.log(' emiting: bookingChange', { memberId, accountId, payments });
//   eventEmitter.emit('change_event', {
//     event: 'bookingChange',
//     memberId,
//     accountId,
//     payments,
//   });
// }
const createItem = async (op, path, value, table, key, item, t) => {
  console.log(`createItem ${op} ${table}`, value);
  if (_.isArray(value)) {
    await models[table].bulkCreate(value, { transaction: t });
  } else {
    await models[table].create(value, { transaction: t });
  }
};
const removePayment = async (paymentId, t) => {
  const pay = await models.Payment.findByPk(paymentId, { transaction: t });
  console.log('deleting', pay);
  let aNo = await models.Allocation.destroy({ where: { paymentId }, transaction: t });
  let pNo = await models.Payment.destroy({ where: { paymentId }, transaction: t });
  return pay.accountId;
};
const processMembers = async (op, path, value, memberId, item, t) => {
  console.log('processMembers', op, path, value, memberId, item);
  if (item) {
    console.log('member  default update', { [item]: value });

    await models.Member.update(
      { [item]: value },
      { where: { memberId: memberId }, transaction: t },
    );
    // refreshMemberIndex(memberId);
  } else if (op === 'del') {
    console.log('member  delete', { memberId, value });
    await models.Member.destroy({ where: { memberId } }, { transaction: t });
    if (value) {
      await models.Account.destroy({ where: { accountId: value } }, { transaction: t });
    }
    qEvent({ event: 'refreshMemberIndex' });
    return;
  } else if (op === 'add') {
    delete value.newMember;
    delete value.deceased;
    console.log('member  create', { value });
    const ret = await models.Member.create(value, { transaction: t });
    // refreshMemberIndex(memberId);
    console.log('ret:', ret);
  } else {
    await models.Member.update(value, {
      where: { memberId: memberId },
      transaction: t,
    });
    // refreshMemberIndex(memberId);
  }
  let data = await models.Member.findByPk(memberId, memberIndex);
  // console.log('emmitting', data);
  if (data) {
    data = data.get({ plain: true });
    delete data.id;
    qEvent({ event: 'refreshMemberIndex', ...data });
  }
  qEvent({ event: 'memberChange', memberId });
  qEvent({ event: 'refreshMemberList' });
};
