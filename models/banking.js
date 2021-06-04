const { DataTypes } = require('sequelize');

const Banking = {
  bankingId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  bankedAmount: DataTypes.NUMBER,
  closingDebt: DataTypes.NUMBER,
  closingCredit: DataTypes.NUMBER,
  openingCredit: DataTypes.NUMBER,
  openingDebt: DataTypes.NUMBER,
  endDate: DataTypes.STRING,
  startDate: DataTypes.STRING,
};
module.exports = Banking;
