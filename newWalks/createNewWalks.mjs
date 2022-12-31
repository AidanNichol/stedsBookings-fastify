import models from '../models/index.js';
import { parseISO, format, addDays } from 'date-fns';
import { parse } from 'csv-parse/sync';
import jetpack from 'fs-jetpack';
import fetch from 'node-fetch';
const progdata = jetpack.read('newWalks/prog2023.csv');

async function create() {
  const prog = parse(progdata, {
    columns: ['date', null, 'venue'],
    skip_empty_lines: true,
    relax_column_count_less: true,
    relax_column_count_more: true,
    trim: true,
  });
  console.log(prog);
  let lastDate = null;
  for (const walk of prog) {
    let { date, venue } = walk;
    if (date !== '') {
      lastDate = parseISO(date);
    } else {
      lastDate = addDays(lastDate, 14);
      date = format(lastDate, 'yyyy-MM-dd');
    }
    let walkId = `W${date}`;
    console.log('walk======>', walkId,venue);
    let lastCancel = addDays(parseISO(`${date} 18:00`), -6);
    let firstBooking = addDays(parseISO(`${date} 00:01`), -45);
    // console.log(format(lastCancel, 'EEEE'));
    // console.log(format(firstBooking, 'EEEE'));
    lastCancel = format(addDays(parseISO(`${date} 18:00`), -6), 'yyyy-MM-dd HH:mm');
    firstBooking = format(addDays(parseISO(`${date} 00:01`), -45), 'yyyy-MM-dd');
    const walkData = {
      walkId,
      venue,
      capacity: 51,
      fee: 12.5,
      lastCancel,
      firstBooking,
      closed: false,
    };
    let res = await models.Walk.create(walkData);
    console.log("inserted");
  }
}
create();
const db = 'https://www.stedwardsfellwalkers.co.uk/bookingsServer/';

const postRequest = async (url, data) => {
  try {
    console.log('postRequest', data);
    const res = await fetch(db + url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    console.log('post result', res);
    let body = await res.json();
    console.log(`postRequest ${url} returned:`, body);
    // console.log(`fetchData ${url} post:`, body);
    return body;
  } catch (error) {
    console.log(error);
  }
};

const postData = (data) => postRequest('bookings/patches', data);
