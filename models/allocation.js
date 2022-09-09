const { DataTypes } = require('sequelize');
const Allocation = {
  id: {
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  bookingId: DataTypes.STRING,
  paymentId: DataTypes.STRING,
  refundId: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  updatedAt: DataTypes.STRING,
};

module.exports = Allocation;
