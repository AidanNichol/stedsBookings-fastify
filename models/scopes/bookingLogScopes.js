module.exports = models => {
  models.BookingLog.addScope('couchDB', {
    // attributes: { include: [['id', '_id']] },
  });
};
