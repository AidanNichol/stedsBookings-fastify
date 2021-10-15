/* eslint-disable node/no-unpublished-import */
import ftp from 'basic-ftp';
import getenv from 'getenv';
import logUpdate from 'log-update';
import { format } from 'date-fns';
import { requestRestart } from './serverUtils.mjs';

example();
let today = format(new Date(), `yyyy-MM-dd_HH-mm`);

async function example() {
  const client = new ftp.Client();
  let last = '';
  client.trackProgress((info) => {
    if (last !== info.name) {
      logUpdate.done();
      last = info.name;
    }
    logUpdate(`File ${info.name},  Bytes ${info.bytes}, Total ${info.bytesOverall},`);
  });
  // client.ftp.verbose = true;
  try {
    await client.access({
      host: 'ftp.stedwardsfellwalkers.co.uk',
      user: 'vscode@stedwardsfellwalkers.co.uk',
      password: getenv('FTPPASSWORD'),
      secure: true,
      port: 21,
      secureOptions: { servername: 'ukhost4u.com' },
    });
    await client.ensureDir('/public_html/bookingsServer');
    console.log(await client.pwd());

    const old = await client.list('database.old.sqlite');
    if (old.length === 1) {
      await client.remove('database.old.sqlite');
    }

    const curr = await client.list('database.sqlite');
    if (curr.length === 1) {
      await client.downloadTo(`DBbackup/database.${today}U.sqlite`, 'database.sqlite');
      await client.rename('database.sqlite', 'database.old.sqlite');
    }

    await client.uploadFrom('database.sqlite', 'database.sqlite');
    await client.uploadFrom('package.json', 'package.json');
    await requestRestart(client);
  } catch (err) {
    console.log(err);
  }
  client.close();
}
