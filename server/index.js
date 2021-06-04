// Require the framework and instantiate it
const fastifyPkg = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyCookie = require('fastify-cookie');
const fastifyStatic = require('fastify-static');
const multipart = require('fastify-multipart');
// const EventIterator = require('event-iterator');
var { EventEmitter, on } = require('events');

// Create an eventEmitter object
var eventEmitter = new EventEmitter();

// const multipart = require('fastify-multipart');

const bookingsRoutes = require('./routes/bookings/bookingsRoutes.js');
const { authRoutes } = require('./routes/authRoutes.js');

const getEnv = require('getenv');
const path = require('path');
const jetpack = require('fs-jetpack');
const getenv = require('getenv');
const http = require('http');
const { cwd, read } = jetpack;
const { promisify } = require('util');
const sleep = promisify(setTimeout);
console.log('loading');
// const galleryDataPath = process.env.GALLERY_DATA;
// console.log('galleryData', galleryDataPath);
const fs = require('fs');
// const walkDataPath = process.env.WALK_DATA;
// console.log('walkdata', walkDataPath);
const sitePrefix = getenv('SITE_PREFIX', '');
const serverFactory = (handler, opts) => {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  return server;
};

// const https = getenv.bool('DEVELOPMENT', false)
//    {
//       https: {
//         key: read('./server.key'),
//         cert: read('./server.crt'),
//       },
//     }
//   : {};
const fastify = fastifyPkg({
  serverFactory,
  logger: {
    level: 'info',
    file: './logs/fastify.log', // will use pino.destination()
  },
});
// fastify.register(fastifyCookie, {
//   secret: getenv('COOKIE_SECRET'), // for cookies signature
//   parseOptions: {}, // options for parsing cookies
// });
// fastify.register(multipart, { attachFieldsToBody: true });
fastify.register(multipart, { attachFieldsToBody: true });

fastify.register(fastifyCors, {
  credentials: true,
  origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
});

fastify.register(require('fastify-sse-v2'));

fastify.get(`/${sitePrefix}`, async (request, reply) => {
  return {
    hello: 'world',
    version: process.versions.node,
    server: fastify.server.address(),
  };
});
// fastify.get('/sse', (request, reply) => {
//   reply.sse(
//     (async function* source() {
//       for (let i = 0; i < 10; i++) {
//         await sleep(2000);
//         fastify.log.warn(`yielding ${String(i)}`);
//         yield { id: String(i), data: 'Some message' };
//       }
//     })(),
//   );
// });
let i = 0;

fastify.get('/sse2', (request, reply) => {
  // const eventEmitter = new EventEmitter();
  reply.sse(
    (async function* () {
      for await (const event of on(eventEmitter, 'some_event')) {
        // console.log('yielding', event.name, event);
        yield {
          id: 'some_event',
          data: JSON.stringify(event),
          crap: 'paper',
        };
      }
    })(),
  );
});
setInterval(() => {
  eventEmitter.emit('some_event', { i: String(++i), other: 'what' });
  // console.log('some_event', String(i));
}, 2000);
fastify.register(bookingsRoutes, { prefix: `${sitePrefix}bookings` });
fastify.register(authRoutes, { prefix: `${sitePrefix}auth` });

// !Run the server!
const runit = async () => {
  try {
    await fastify.listen(4444);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(
    `listening on ${JSON.stringify(fastify.server.address())}:${
      fastify.server.address().port
    }`,
  );
};
runit();
