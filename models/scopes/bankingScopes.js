module.exports = models => {
  models.Banking.addScope('couchDB', {
    attributes: { include: [['bankingId', '_id']] },
    order: ['startDate'],
    limit: 1,
    include: {
      model: models.Payment,
      attributes: [['accountId', 'accId'], ['amount', 'paymentsMade'], 'paymentId'],
    },
  });
  models.Banking.addScope('latest', {
    order: ['startDate'],
    limit: 1,
  });
};
