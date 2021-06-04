const { DataTypes } = require('sequelize');
// const Op = sequelize.Sequelize.Op;

const Refund = {
  refundId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  accountId: DataTypes.STRING,
  req: DataTypes.STRING,
  who: DataTypes.STRING,
  note: DataTypes.STRING,
  amount: DataTypes.NUMBER,
  available: DataTypes.NUMBER,
};
module.exports = Refund;
