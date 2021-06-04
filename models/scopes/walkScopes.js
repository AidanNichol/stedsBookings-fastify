const { todaysDate: today } = require('./dateFns');
// let format = require('date-fns/format');
const sequelize = require('sequelize');
const Op = sequelize.Op;
// const today = () => format(new Date(), 'yyy-MM-dd');
const bCount = `
SELECT COUNT(*) 
FROM bookings AS booking
WHERE
    booking.walkId = Walk.walkId`;

module.exports = (models) => {
  models.Walk.addScope('couchDB', {
    attributes: { include: [['walkId', '_id']] },
    include: { model: models.Booking.scope('couchDB') },
  });
  models.Walk.addScope('index', {
    attributes: [
      ['walkId', 'id'],
      'walkId',
      'venue',
      'fee',
      ['venue', 'name'],
      'lastCancel',
      'shortCode',
    ],
  });

  models.Walk.addScope('active', {
    order: ['walkId'],
    where: {
      [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
    },
  });
  models.Walk.addScope('firstBooking', {
    order: ['walkId'],
    limit: 1,
    where: {
      [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }],
    },
  });
  models.Walk.addScope('firstBookingDate', {
    attributes: ['firstBooking'],
  });

  models.Walk.addScope('bookingCount', {
    where: { [Op.and]: [{ firstBooking: { [Op.lte]: today() } }, { closed: false }] },
    attributes: [
      'walkId',
      'venue',
      [sequelize.literal(`(${bCount} AND booking.status = "B" )`), 'booked'],
      [sequelize.literal(`(${bCount} AND booking.status = "C" )`), 'cars'],
      [sequelize.literal(`(${bCount} AND booking.status = "W" )`), 'waiting'],
      [sequelize.literal(`(${bCount} AND booking.owing > 0 )`), 'noOwing'],
      'firstBooking',
      'longName',
      'shortName',
      'displayDate',
      'closed',
      'capacity',
      'fee',
    ],
  });
  models.Walk.addScope('buslist', {
    attributes: ['walkId', 'venue', 'capacity', 'displayDate', 'longName'],
    include: {
      model: models.Booking,
      required: false,
      attributes: ['memberId', 'status', 'updatedAt'],
      where: {
        status: ['B', 'C', 'W'],
      },
      include: {
        model: models.Member,
        attributes: ['firstName', 'lastName', 'sortName', 'accountId'],
      },
    },
  });
};
