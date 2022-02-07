const { DataTypes } = require('sequelize');
// const Op = sequelize.Sequelize.Op;

const Booking = {
  bookingId: { type: DataTypes.STRING, primaryKey: true },
  walkId: DataTypes.STRING,
  memberId: DataTypes.STRING,
  status: DataTypes.STRING,
  annotation: DataTypes.STRING,
  paid: { type: DataTypes.NUMBER, defaultValue: 0 },
  owing: { type: DataTypes.NUMBER, defaultValue: 0 },
  fee: { type: DataTypes.NUMBER, defaultValue: 0 },
  late: { type: DataTypes.BOOLEAN, defaultValue: false },
  updatedAt: DataTypes.STRING,
  createdAt: DataTypes.STRING,
};

module.exports = Booking;
