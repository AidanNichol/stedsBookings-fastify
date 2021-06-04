const Op = require('sequelize').Op;
module.exports = (models) => {
  models.Refund.addScope('couchDB', {
    attributes: {
      include: [['refundId', 'dat']],
    },
  });
  models.Refund.addScope('active', function (startDate) {
    return {
      where: {
        [Op.or]: [{ refundId: { [Op.gte]: startDate } }, { available: { [Op.gt]: 0 } }],
      },
    };
  });
  models.Refund.addScope('range', function (startDate, endDate) {
    return {
      where: {
        [Op.and]: [
          { refundId: { [Op.lt]: startDate } },
          { refundId: { [Op.gte]: endDate } },
          { available: { [Op.eq]: 0 } },
          // { updatedAt: { [Op.lt]: startDate } },
        ],
      },
    };
  });
  models.Refund.addScope('historic', {
    order: 'paymentId',
    required: false,
    // attributes: ['paymentId', 'amount', 'req', 'available'],
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Payment,
        required: false,
      },
    },
  });
  models.Refund.addScope('details', {
    order: 'refundId',
    required: false,
    attributes: ['refundId', 'amount', 'req', 'available'],
    include: { model: models.Allocation, required: false },
  });
};
