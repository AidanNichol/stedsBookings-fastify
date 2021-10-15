const models = require('../../../models');
// var { eventEmitter } = require('../../eventEmitter');
const { membershipListRpt } = require('../../../ReportsPdf/membershipListRpt');
const fs = require('fs');
const path = require('path');

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
  fastify.get(`/allMembers`, async () => {
    return await models.Member.findAll();
  });
  fastify.get(`/membershipListRpt/:all/:sortBy`, async (request, res) => {
    const { all, sortBy } = request.params;
    let fileName = await membershipListRpt(all, sortBy);
    console.log('about to send members report');
    res.header('Content-Disposition', `inline; filename="${fileName}"`);
    const stream = fs.createReadStream(path.resolve(`documents/${fileName}`));
    res.type('application/pdf').send(stream);
  });
  fastify.get(`/memberData/:id`, async (request) => {
    const { id } = request.params;

    // try {
    console.log('findByKey', { id });
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
    data.shortName = data.Account.Members > 1 ? `[${data.firstName}]` : '';
    // } catch (error) {
    //   let { message, name, DatabaseError, sql } = error;

    //   throw new Error( { message, name, DatabaseError, sql });
    //   return { error: { message, name, DatabaseError } };
    // }

    // console.log('returned', data);
    return data;
  });
}
module.exports = { memberRoutes, memberIndex };
// module.exports = { memberRoutes, refreshMemberIndex };
// let timeoutId;
// function refreshMemberIndex(memberId) {
//   if (timeoutId) clearTimeout(timeoutId);
//   timeoutId = setTimeout(async () => {
//     console.log('refreshing', 'MemberIndex', memberId);
//     if (!memberId) {
//       eventEmitter.emit('change_event', { event: 'refreshMemberIndex' });
//       return;
//     }
//     let data = await models.Member.findByPk(memberId, memberIndex);
//     // console.log('emmitting', data);
//     if (data) {
//       data = data.get({ plain: true });
//       delete data.id;
//       eventEmitter.emit('change_event', { event: 'refreshMemberIndex', ...data });
//     }
//     eventEmitter.emit('change_event', { event: 'memberChange', memberId });
//     timeoutId = null;
//   }, 1000);
// }
