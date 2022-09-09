const { DataTypes } = require('sequelize');

const Banking = {
  bankingId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  bankedAmount: DataTypes.FLOAT,
  closingDebt: DataTypes.FLOAT,
  closingCredit: DataTypes.FLOAT,
  openingCredit: DataTypes.FLOAT,
  openingDebt: DataTypes.FLOAT,
  endDate: DataTypes.STRING,
  startDate: DataTypes.STRING,
};
module.exports = Banking;
