require('dotenv').config();

const getenv = require('getenv');
const Sequelize = require('sequelize');

let sequelize = new Sequelize({
  dialect: 'mysql',
  dialectOptions: {
    host: 'localhost',
    user: getenv('mysql_user'),
    database: getenv('mysql_database'),
    password: getenv('mysql_password'),
  },
  logging: false,
  // dialectOptions: { decimalNumbers: true },
});
const ts = { timestamp: false, createdAt: false, updatedAt: false };
const noAction = { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' };

const Walk = sequelize.define('Walk', require('./walk.js'), ts);
const Booking = sequelize.define('Booking', require('./booking.js'), ts);
const BookingLog = sequelize.define('BookingLog', require('./bookinglog.js'), ts);
const Account = sequelize.define('Account', require('./account.js'), ts);
const Member = sequelize.define('Member', require('./member.js'), ts);
const Payment = sequelize.define('Payment', require('./payment.js'), ts);
const Refund = sequelize.define('Refund', require('./refund.js'), ts);
const Allocation = sequelize.define('Allocation', require('./allocation.js'), ts);
const Banking = sequelize.define('Banking', require('./banking.js'), ts);
const User = sequelize.define('User', require('./user.js'), ts);
Account.hasMany(Member, { foreignKey: 'accountId', sourceKey: 'accountId' });
Account.hasMany(Payment, { foreignKey: 'accountId', sourceKey: 'accountId' });
Account.hasMany(Refund, { foreignKey: 'accountId', sourceKey: 'accountId' });
Allocation.belongsTo(Payment, { foreignKey: 'paymentId' });
Allocation.belongsTo(Booking, {
  foreignKey: 'bookingId',
  ...noAction,
});

Allocation.belongsTo(Refund, { foreignKey: 'refundId' });

Booking.belongsTo(Walk, { foreignKey: 'walkId', ...noAction });
Booking.hasMany(BookingLog, {
  foreignKey: 'bookingId',
  sourceKey: 'bookingId',
  ...noAction,
});
Booking.belongsTo(Member, { foreignKey: 'memberId' });
Booking.hasMany(Allocation, {
  foreignKey: 'bookingId',
  sourceKey: 'bookingId',
  ...noAction,
});
BookingLog.belongsTo(Booking, {
  foreignKey: 'bookingId',
  ...noAction,
});

Member.hasMany(Booking, { foreignKey: 'memberId', sourceKey: 'memberId' });
Member.hasOne(Account, { foreignKey: 'accountId', constraints: false });
Member.belongsTo(Account, { foreignKey: 'accountId', constraints: false });
Payment.belongsTo(Account, { foreignKey: 'accountId' });

Payment.hasMany(Allocation, { foreignKey: 'paymentId' });
Payment.hasOne(Allocation, { foreignKey: 'refundId' });
Refund.belongsTo(Account, { foreignKey: 'accountId' });
Refund.hasMany(Allocation, { foreignKey: 'refundId' });
Walk.hasMany(Booking, { foreignKey: 'walkId', sourceKey: 'walkId' });

const db = {
  Walk,
  Booking,
  BookingLog,
  Account,
  Member,
  Payment,
  Refund,
  Allocation,
  Banking,
  User,
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
