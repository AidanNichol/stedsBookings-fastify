const { userTransactionRpt } = require('./userTransactionRpt');
const { getUserTransactionData } = require('./getUserTransactionData');

async function testTransactionRpt(accountId, startDate) {
  startDate = '2020-12-01';
  const { account, bookings, payments, refunds } = await getUserTransactionData(
    accountId,
    startDate,
  );

  userTransactionRpt(account, bookings, payments, refunds); //aidan
}

testTransactionRpt('A825J', '2021-01-01'); // Reed
testTransactionRpt('A1049', '2021-01-01'); //aidan
testTransactionRpt('A2018J', '2021-01-01'); //Maccallum
testTransactionRpt('A853J', '2021-01-01'); // Booth
testTransactionRpt('A2009', '2021-01-01'); // Ellie Wilkes
testTransactionRpt('A2055', '2021-01-01'); // Money
// const { paymentsReceivedRpt } = require('./paymentsReceivedRpt');
// paymentsReceivedRpt();
// const { creditsOwedRpt } = require('./creditsOwedRpt');
// creditsOwedRpt();
// const { membershipListRpt } = require('./membershipListRpt');
// membershipListRpt('Y', 'memNo');
// membershipListRpt('N', 'sortName');
