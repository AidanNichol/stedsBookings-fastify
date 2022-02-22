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
  amount: DataTypes.INTEGER,
  available: DataTypes.INTEGER,
};
module.exports = Refund;
