module.exports = (models) => {
  models.Member.addScope('couchDB', {
    attributes: { include: [['memberId', '_id']] },
  });
  models.Member.addScope('index', {
    attributes: [
      ['memberId', 'id'],
      'memberId',
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
  });
  models.Member.addScope('basic', {
    attributes: [
      'memberId',
      'firstName',
      'lastName',
      'shortName',
      'memberStatus',
      'fullName',
      'sortName',
    ],
  });
  models.Member.addScope('minimal', {
    attributes: [
      'memberId',
      'firstName',
      'lastName',
      'shortName',
      'memberStatus',
      'fullName',
      'sortName',
    ],
  });
  models.Member.addScope('includeAccount', {
    include: { model: models.Account, include: { model: models.Member.scope('index') } },
  });
};
