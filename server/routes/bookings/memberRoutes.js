const models = require('../../../models');
var { eventEmitter } = require('../../eventEmitter');

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');
const memberIndex = {
  attributes: [
    ['memberId', 'id'],
    'memberId',
    'memNo',
    'firstName',
    'lastName',
    'shortName',
    'memberStatus',
    'subscription',
    'fullName',
    'sortName',
    'accountId',
    'subsStatus',
  ],
};
async function memberRoutes(fastify) {
  fastify.get(`/index`, async () => {
    return await models.Member.findAll(memberIndex);
  });
  fastify.get(`/memberData/:id`, async (request) => {
    const { id } = request.params;

    // try {
    console.log('findAllByKey', { id });
    let data = await models.Member.findByPk(id, {
      // where: { [key]: id },
      include: {
        model: models.Account,
        include: {
          model: models.Member,
          attributes: [
            ['memberId', 'id'],
            'memberId',
            'memNo',
            'firstName',
            'lastName',
            'shortName',
            'memberStatus',
            'subscription',
            'fullName',
            'sortName',
            'accountId',
            'subsStatus',
          ],
        },
      },
    });
    // } catch (error) {
    //   let { message, name, DatabaseError, sql } = error;

    //   throw new Error( { message, name, DatabaseError, sql });
    //   return { error: { message, name, DatabaseError } };
    // }

    // console.log('returned', data);
    return data;
  });
}
module.exports = { memberRoutes, refreshMemberIndex };
let timeoutId;
function refreshMemberIndex(memberId) {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    console.log('refreshing', 'MemberIndex');
    let data = await models.Member.findByPk(memberId, memberIndex);
    // console.log('emmitting', data);
    data = data.get({ plain: true });
    delete data.id;
    eventEmitter.emit('change_event', { id: 'refreshMemberIndex', ...data });
    timeoutId = null;
  }, 100);
}
