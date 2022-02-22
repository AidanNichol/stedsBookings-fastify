const { DataTypes } = require('sequelize');

const Banking = {
  bankingId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
  },
  bankedAmount: DataTypes.INTEGER,
  closingDebt: DataTypes.INTEGER,
  closingCredit: DataTypes.INTEGER,
  openingCredit: DataTypes.INTEGER,
  openingDebt: DataTypes.INTEGER,
  endDate: DataTypes.STRING,
  startDate: DataTypes.STRING,
};
module.exports = Banking;
