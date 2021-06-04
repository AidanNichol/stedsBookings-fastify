const models = require('../../../models');
const _ = require('lodash');
const {
  bookingCount,
  refreshBookingCount,
} = require('../../routes/bookings/walkRoutes.js');
// const { broadcast } = require('../sockets');
module.exports.withPatches = (patches) => {
  console.log('patches', patches);
  try {
    const result = [];
    patches.forEach((patch) => {
      const { op, path, value } = patch;
      const [table, key, item] = path;
      switch (table) {
        case 'Booking':
        case 'Payment':
          processItem(op, path, value, table, key, item);
          result.push({ op, path, patch: 'applied' });
          break;
        case 'BookingLog':
        case 'Allocation':
          createItem(op, path, value, table, key, item);
          result.push({ op, path, patch: 'applied' });
          break;
        case 'members':
          processMembers(op, path, value, key, item);
          result.push({ op, path, patch: 'applied' });
          break;

        default:
          console.warn('skipping table :', table);
          result.push({ op, path, patch: 'skiped' });
          break;
      }
    });
    return result;
  } catch (error) {
    let { message, name, DatabaseError, sql, stack } = error;

    console.error('error in query: activeData', { message, name, DatabaseError, sql });
    return { error: { message, name, DatabaseError, stack } };
  }
};
const processItem = async (op, path, value, table, key, item) => {
  const id = table.toLowerCase() + 'Id';
  let res;
  if (item) {
    // const bkng0 = await models[table].findByPk(key);
    console.log('pre update', table, id, item, value);
    res = await models[table].update({ [item]: value }, { where: { [id]: key } });
  } else {
    console.log(`${op} ${table}`, id, key, value);
    await models[table].findOrCreate({ where: { [id]: key } });
    res = await models[table].update(value, { where: { [id]: key } });
  }
  if (table === 'Booking') {
    await refreshBookingCount();
  }
  console.log('returned', res);
  return res;
};
const createItem = async (op, path, value, table, key, item) => {
  console.log(`${op} ${table}`, value);
  if (_.isArray(value)) {
    await models[table].bulkCreate(value);
  } else {
    await models[table].create(value);
  }
};

const processMembers = async (op, path, value, key, item) => {
  switch (op) {
    case 'add':
    case 'replace':
      if (!item) {
        const newMember = value.newMember;
        delete value.newMember;
        if (newMember) await models.Member.create(value);
        else await models.Member.update({ item: value }, { where: { memberId: key } });
      } else {
        await models.Member.update({ item: value }, { where: { memberId: key } });
      }
      const data = await models.Member.scope('index').findByPk(key);
      console.log('index data', data);
      // broadcast({ type: 'member', data });
      break;
    default:
      await models.Member.update({ [item]: value }, { where: { memberId: key } });
      break;
  }
};
