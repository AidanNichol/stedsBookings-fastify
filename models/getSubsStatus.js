const getSubsStatus = (memberStatus, subscription) => {
  let _today = new Date();
  // DS.todaysDate;
  let status = 'ok';
  if (memberStatus === 'HLM') return { due: false, status, showSubsButton: false };
  if (memberStatus === 'Guest')
    return { due: false, status: 'guest', showSubsButton: false };

  const currentUserSubs = parseInt(subscription || 0);

  let fee = 15;
  // const _today = new Date();
  let thisYear = _today.getFullYear();
  // year - all new subs will be ok until the end of thie 'year'
  let year = _today >= new Date(`${thisYear}-10-01`) ? thisYear + 1 : thisYear;
  // dueSubsYear - we are collecting subs for this year
  let dueSubsYear = _today >= new Date(`${thisYear}-12-31`) ? thisYear + 1 : thisYear;
  // okSubsYear - if current value is this then you get the reduced rate.
  let okSubsYear = _today < new Date(`${thisYear}-02-01`) ? thisYear - 1 : thisYear;
  let showSubsButton = _today >= new Date(`${thisYear}-12-01`) && currentUserSubs < year;
  if (currentUserSubs >= okSubsYear) fee = 13;
  // console.log({currentUserSubs, year, thisYear, dueSubsYear,  okSubsYear, showSubsButton})
  if (currentUserSubs >= year || currentUserSubs >= dueSubsYear) {
    if (showSubsButton) return { due: false, status, year, fee, showSubsButton };
    else return { due: false, status, showSubsButton };
  }
  status = 'due';
  if (currentUserSubs >= okSubsYear) fee = 13;
  else status = 'late';
  showSubsButton = true;
  return { due: true, year, fee, status, showSubsButton };
};
exports.getSubsStatus = getSubsStatus;
