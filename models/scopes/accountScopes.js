const Op = require('sequelize').Op;
module.exports = (models) => {
  models.Account.addScope('couchDB', {
    attributes: { include: [['accountId', '_id']] },
    include: [
      {
        model: models.Payment,
        order: 'paymentId',
        attributes: {
          include: [['paymentId', 'dat']],
        },
        include: {
          model: models.Allocation,
        },
      },
      {
        model: models.Refund,
        order: 'refundId',
        attributes: {
          include: [['refundId', 'dat']],
        },
        include: {
          model: models.Allocation,
        },
      },
    ],
  });
  models.Account.addScope('active', function (startDate) {
    return {
      where: {
        [Op.or]: [{ paymentId: { [Op.gte]: startDate } }, { available: { [Op.gt]: 0 } }],
      },
    };
  });
  models.Account.addScope('index', {
    attributes: [['accountId', 'id'], 'accountId', 'name', 'sortName'],
  });
  models.Account.addScope('activeData', function (startDate) {
    const scope = ['details', { method: ['active', startDate] }];
    return {
      attributes: ['accountId', 'name'],
      include: [
        { model: models.Payment.scope(scope) },
        { model: models.Refund.scope(scope) },
        {
          model: models.Member,
          attributes: ['memberId', 'firstName', 'lastName', 'shortName'],
          // exclude: { attributes: ['createdAt', 'address'] },
          include: [{ model: models.Booking.scope(scope) }],
        },
      ],
    };
  });
  models.Account.addScope('currentData', function (startDate) {
    const scope = ['details', { method: ['active', startDate] }];
    return {
      attributes: ['accountId', 'name'],
      include: [
        { model: models.Payment.scope(scope) },
        { model: models.Refund.scope(scope) },
        {
          model: models.Member,
          attributes: ['memberId', 'firstName', 'lastName', 'shortName'],
          // exclude: { attributes: ['createdAt', 'address'] },
          include: [{ model: models.Booking.scope(scope) }],
        },
      ],
    };
  });
  models.Account.addScope('currentMinimal', function (startDate, today) {
    const scope = ['basic', { method: ['active', startDate] }];
    const bScope = ['basic', { method: ['active', today] }];
    return {
      attributes: ['accountId', 'name', 'sortName'],
      include: [
        { model: models.Payment.scope(scope) },
        {
          model: models.Member,
          attributes: ['memberId', 'firstName', 'lastName', 'shortName'],
          // exclude: { attributes: ['createdAt', 'address'] },
          include: [{ model: models.Booking.scope(bScope) }],
        },
      ],
    };
  });
  models.Account.addScope('historicData', function (startDate, endDate) {
    const scope = ['historic', { method: ['range', startDate, endDate] }];
    return {
      attributes: ['accountId', 'name'],
      include: [
        { model: models.Payment.scope(scope) },
        { model: models.Refund.scope(scope) },
        // { model: models.Refund.scope([active]) },
      ],
    };
  });
  models.Account.addScope('creditsOwed', {
    include: [{ model: models.Payment.scope(['creditsOwed']), required: true }],
  });
};
