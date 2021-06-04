const Op = require('sequelize').Op;
module.exports = (models) => {
  models.Payment.addScope('couchDB', {
    attributes: {
      include: [['paymentId', 'dat']],
    },
  });
  models.Payment.addScope('active', function (startDate) {
    return {
      where: {
        [Op.or]: [
          { paymentId: { [Op.gte]: startDate } },
          { updatedAt: { [Op.gte]: startDate } },
          { available: { [Op.gt]: 0 } },
        ],
      },
    };
  });
  models.Payment.addScope('range', function (startDate, endDate) {
    return {
      where: {
        [Op.and]: [
          { paymentId: { [Op.lt]: startDate } },
          { paymentId: { [Op.gte]: endDate } },
          { available: { [Op.eq]: 0 } },
          { updatedAt: { [Op.lt]: startDate } },
        ],
      },
    };
  });
  models.Payment.addScope('details', {
    order: 'paymentId',
    required: false,
    // attributes: ['paymentId', 'amount', 'req', 'available'],
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Booking.scope(['historic', 'includeWalk', 'includeMember']),
      },
    },
  });
  models.Payment.addScope('basic', {
    order: 'paymentId',
    required: false,
    // attributes: ['paymentId', 'amount', 'req', 'available'],
  });
  models.Payment.addScope('historic', {
    order: 'paymentId',
    required: false,
    // attributes: ['paymentId', 'amount', 'req', 'available'],
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Booking.scope(['historic', 'includeWalk', 'includeMember']),
      },
    },
  });
  models.Payment.addScope('paymentsMade', {
    order: ['paymentId'],
    where: {
      [Op.and]: {
        paymentId: { [Op.gt]: '2019-04-01' },
        bankingId: { [Op.is]: null },
        req: { [Op.startsWith]: 'P' },
      },
    },
    required: false,
    attributes: ['paymentId', 'amount', 'req', 'available', 'accountId'],
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Booking,
        include: {
          model: models.BookingLog,
          limit: 1,
          where: { fee: { [Op.ne]: 0 } },
          attributes: ['id', 'req', 'dat', 'fee', 'late'],
          include: { model: models.Allocation, required: false },
        },
      },
    },
  });
  models.Payment.addScope('creditsOwed', {
    order: ['paymentId'],
    where: { available: { [Op.gt]: 0 } },
    required: false,
    attributes: ['paymentId', 'amount', 'req', 'available'],
    include: {
      model: models.Allocation,
      required: false,
      include: {
        model: models.Booking.scope(['historic', 'includeWalk', 'includeMember']),
      },
    },
  });
};
