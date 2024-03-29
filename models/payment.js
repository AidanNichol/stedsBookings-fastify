const { DataTypes } = require('sequelize');
// const Op = sequelize.Sequelize.Op;

const Payment = {
  paymentId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  accountId: DataTypes.STRING,
  bankingId: DataTypes.STRING,
  refundId: DataTypes.STRING,
  req: DataTypes.STRING,
  who: DataTypes.STRING,
  note: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  available: DataTypes.FLOAT,
  updatedAt: DataTypes.STRING,
};
module.exports = Payment;
