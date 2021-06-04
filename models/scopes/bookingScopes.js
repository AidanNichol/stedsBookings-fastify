// let format = require('date-fns/format');
const Op = require('sequelize').Op;
// const today = () => format(new Date(), 'yyy-MM-dd');
module.exports = (models) => {
  models.Booking.addScope('couchDB', {
    include: { model: models.BookingLog },
  });
  models.Booking.addScope('details', {
    required: false,
    // attributes: [ 'bookingId', 'walkId', 'memberId', 'status', 'fee', 'late', 'owing', 'annotations', 'updatedAt', ],
    include: [
      {
        model: models.Walk,
        attributes: ['venue', 'fee', 'bookable', 'firstBooking', 'closed'],
      },
      {
        model: models.BookingLog,
        attributes: ['id', 'req', 'dat', 'fee', 'late'],
        required: false,
        include: { model: models.Allocation, required: false },
      },
      {
        model: models.Allocation,
        required: false,
      },
    ],
  });
  models.Booking.addScope('basic', {
    required: false,
  });
  const includeLogs = {
    required: false,
    include: [
      {
        model: models.BookingLog,
        attributes: ['id', 'req', 'dat', 'fee', 'late'],
        include: { model: models.Allocation, required: false },
      },
    ],
  };

  models.Booking.addScope('historic', includeLogs);
  models.Booking.addScope('includeLogs', includeLogs);
  const includeWalk = {
    required: false,
    include: [
      {
        model: models.Walk,
        attributes: ['venue', 'fee', 'bookable', 'firstBooking', 'closed'],
      },
    ],
  };
  models.Booking.addScope('includeWalk', includeWalk);
  const includeMember = {
    required: false,
    include: [{ model: models.Member, attributes: ['accountId', 'shortName'] }],
  };
  models.Booking.addScope('includeMember', includeMember);
  const includeAccount = {
    required: false,
    include: [
      {
        model: models.Member,
        include: { model: models.Account },
      },
    ],
  };
  models.Booking.addScope('includeAccount', includeAccount);
  const includeAllocation = {
    required: false,
    include: [{ model: models.Allocation, required: false }],
  };
  models.Booking.addScope('includeAllocations', includeAllocation);
  models.Booking.addScope('active', function (startDate) {
    return {
      where: {
        [Op.or]: [
          { bookingId: { [Op.gte]: 'W' + startDate } },
          { updatedAt: { [Op.gte]: startDate } },
          { owing: { [Op.gt]: 0 } },
        ],
      },
    };
  });
  models.Booking.addScope('owing', function (startDate) {
    return {
      where: { owing: { [Op.gt]: 0 } },
      include: [
        {
          model: models.BookingLog,
          where: { fee: { [Op.ne]: 0 } },
          attributes: ['id', 'req', 'dat', 'fee', 'late'],
          include: { model: models.Allocation, required: false },
        },
      ],
    };
  });
  models.Booking.addScope('buslist', {
    attributes: ['memberId', 'status', 'updatedAt'],
    where: {
      status: ['B', 'C', 'W'],
    },
    include: {
      model: models.Member,
      attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
    },
  });
};
