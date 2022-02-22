const { DataTypes } = require('sequelize');
const BookingLog = {
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  bookingId: DataTypes.STRING,
  dat: DataTypes.STRING,
  req: DataTypes.STRING,
  who: DataTypes.STRING,
  note: DataTypes.STRING,
  fee: { type: DataTypes.INTEGER, defaultValue: 0 },
  late: { type: DataTypes.BOOLEAN, defaultValue: false },
};

module.exports = BookingLog;
