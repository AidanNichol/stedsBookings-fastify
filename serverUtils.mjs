import { format, addHours } from 'date-fns';

export const requestRestart = async (client) => {
  let localTime = new Date();
  const tz = format(localTime, 'x');
  let utcTime = addHours(localTime, -1 * tz);
  let now = format(utcTime, 'yyyyMMddHHmmss');
  await client.send(`SITE UTIME ${now}  tmp/restart.txt`);
  console.log(
    'Restart Requested',
    tz,
    now,
    format(utcTime, 'HH'),
    format(localTime, 'HH'),
  );
};
