const { DataTypes } = require('sequelize');
const Allocation = {
  bookingId: DataTypes.STRING,
  paymentId: DataTypes.STRING,
  refundId: DataTypes.STRING,
  amount: DataTypes.NUMBER,
  updatedAt: DataTypes.STRING,
};

module.exports = Allocation;
