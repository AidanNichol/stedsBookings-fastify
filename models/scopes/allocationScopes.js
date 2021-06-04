// const Op = require('sequelize').Op;
module.exports = (models) => {
  models.Allocation.addScope('couchDB', {
    // attributes: { include: [['id', '_id']] },
  });
  models.Allocation.addScope('historic', {
    // attributes: { include: [['id', '_id']] },
  });
  models.Allocation.addScope('includeBookings', {
    include: {
      model: models.Booking,
      include: {
        model: models.BookingLog,
        include: { model: models.Allocation, required: false },
      },
    },
  });
};
