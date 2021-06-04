const { DataTypes } = require('sequelize');
module.exports = {
  accountId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.STRING,
    validate: { is: /^A\d+J?$/ },
  },
  name: DataTypes.STRING,
  sortName: DataTypes.STRING,
};

// {
//   tableName: 'accounts',
//   timestamps: false,

//   scopes: {
//     me: {
//       where: { accountId: 'A1049' },
//     },

//     includeBookings2: {
//       include: [
//         {
//           model: this.Member,
//           attributes: ['firstName', 'lastName', 'shortName'],
//           include: [
//             {
//               model: this.Booking,
//               include: [
//                 { model: this.Walk, attributes: ['walkId', 'venue'] },
//                 { model: this.bookingLogs },
//                 { model: this.allocation },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   },
// },
