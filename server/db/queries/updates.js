const models = require('../../../models');
const _ = require('lodash');
var { eventEmitter } = require('../../eventEmitter');

const { refreshBookingCount } = require('../../routes/bookings/walkRoutes.js');
const { refreshMemberIndex } = require('../../routes/bookings/memberRoutes');
// const { broadcast } = require('../sockets');
module.exports.withPatches = async (patches) => {
  console.log('patches', patches);
  const t = await models.sequelize.transaction();
  try {
    const result = [];
    let memberId = null,
      accountId = null,
      payments = false;
    for (const patch of patches) {
      // patches.forEach((patch) => {
      const { op, path, value } = patch;
      const [table, key, item] = path;
      switch (table) {
        case 'Booking':
        case 'Payment':
          await processItem(op, path, value, table, key, item, t);
          result.push({ op, path, patch: 'applied' });
          break;
        case 'BookingLog':
        case 'Allocation':
          await createItem(op, path, value, table, key, item, t);
          result.push({ op, path, patch: 'applied' });
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
      if (table === 'Booking') {
        refreshBookingCount();
        memberId = value && value.bookingId && value.bookingId.substr(11);
      }
      payments = payments || table === 'Allocation';
      if (op === 'add' && table === 'Payment') {
        accountId = value.accountId;
      }
    }
    await t.commit();
    bookingChanged(memberId, accountId, payments);
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
  // if (table === 'Booking') {
  //   refreshBookingCount();
  // }

  console.log('returned', res);
  return res;
};
function bookingChanged(memberId, accountId, payments) {
  if (!memberId && !accountId) return;
  console.log(' emiting: bookingChange', { memberId, accountId, payments });
  eventEmitter.emit('change_event', {
    event: 'bookingChange',
    memberId,
    accountId,
    payments,
  });
}
const createItem = async (op, path, value, table, key, item, t) => {
  console.log(`createItem ${op} ${table}`, value);
  if (_.isArray(value)) {
    await models[table].bulkCreate(value, { transaction: t });
  } else {
    await models[table].create(value, { transaction: t });
  }
};

const processMembers = async (op, path, value, memberId, item, t) => {
  // console.log('processMembers', op, path, value, key, item);
  switch (op) {
    case 'add':
    case 'replace':
      if (!item) {
        const newMember = value.newMember;
        delete value.newMember;
        if (newMember) {
          // console.log('member  create', { value });
          await models.Member.create(value, { transaction: t });
        } else {
          // console.log('member  update', { value });
          await models.Member.update(value, {
            where: { memberId: memberId },
            transaction: t,
          });
        }
      } else {
        await models.Member.update(
          { [item]: value },
          { where: { memberId: memberId }, transaction: t },
        );
      }
      refreshMemberIndex(memberId);
      break;
    default:
      console.log('member  default update', { [item]: value });

      await models.Member.update(
        { [item]: value },
        { where: { memberId: memberId }, transaction: t },
      );
      break;
  }
};
