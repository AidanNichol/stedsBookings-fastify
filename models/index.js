// const fs = require('fs');
// const path = require('path');
const Sequelize = require('sequelize');
// const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
const ts = { timestamp: false, createdAt: false, updatedAt: false };
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
Allocation.belongsTo(Booking, { foreignKey: 'bookingId' });
Allocation.belongsTo(BookingLog, {
  targetKey: 'id',
  foreignKey: 'bookingTransactionDate',
});
Allocation.belongsTo(Refund, { foreignKey: 'refundId' });
Banking.hasMany(Payment, { foreignKey: 'bankingId' });
Booking.belongsTo(Walk, { foreignKey: 'walkId' });
Booking.hasMany(BookingLog, {
  foreignKey: 'bookingId',
  sourceKey: 'bookingId',
});
Booking.belongsTo(Member, { foreignKey: 'memberId' });
Booking.hasMany(Allocation, {
  foreignKey: 'bookingId',
  sourceKey: 'bookingId',
});
BookingLog.belongsTo(Booking, { foreignKey: 'bookingId' });
BookingLog.hasMany(Allocation, {
  foreignKey: 'bookingTransactionDate',
  sourceKey: 'id',
});
Member.hasMany(Booking, { foreignKey: 'memberId', sourceKey: 'memberId' });
Member.hasOne(Account, { foreignKey: 'accountId' });
Member.belongsTo(Account, { foreignKey: 'accountId' });
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
// add scopes
require('./scopes/bookingLogScopes')(db);
require('./scopes/bookingScopes')(db);
require('./scopes/walkScopes')(db);
require('./scopes/paymentScopes')(db);
require('./scopes/refundScopes')(db);
require('./scopes/accountScopes')(db);
require('./scopes/memberScopes')(db);
require('./scopes/allocationScopes')(db);
require('./scopes/bankingScopes')(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
