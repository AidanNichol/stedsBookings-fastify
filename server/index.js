// Require the framework and instantiate it
const fastifyPkg = require('fastify');
const fastifyCors = require('fastify-cors');
// const fastifyCookie = require('fastify-cookie');
// const fastifyStatic = require('fastify-static');
const multipart = require('fastify-multipart');
var { eventEmitter, on } = require('./eventEmitter');

const bookingsRoutes = require('./routes/bookings/bookingsRoutes.js');
const { authRoutes } = require('./routes/authRoutes.js');
const packageJson = require('../package.json');
const version = packageJson.version;

// const getEnv = require('getenv');
// const path = require('path');
// const jetpack = require('fs-jetpack');
// const getenv = require('getenv');
const http = require('http');
// const { cwd, read } = jetpack;
// const { promisify } = require('util');
// const sleep = promisify(setTimeout);
console.log('loading');
// const fs = require('fs');
const sitePrefix = 'bookingsServer/';
// const sitePrefix = getenv('SITE_PREFIX', '');
const serverFactory = (handler) => {
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

fastify.get(`/${sitePrefix}`, async () => {
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

fastify.get('/sse2', (request, reply) => {
  // const eventEmitter = new EventEmitter();
  reply.sse(
    (async function* () {
      for await (const event of on(eventEmitter, 'change_event')) {
        let { id, ...data } = event.pop();
        yield { id, data: JSON.stringify(data) };
      }
    })(),
  );
  let i = 0;
  let j = 0;
  setInterval(() => {
    eventEmitter.emit('change_event', {
      id: 'some_event',
      i: String(++i),
      other: 'what',
    });
    // console.log('some_event', String(i));
  }, 3000);
  setInterval(() => {
    eventEmitter.emit('change_event', {
      id: 'other_event',
      j: String(++j),
      other: 'why',
    });
    // console.log('some_event', String(i));
  }, 7000);
});
fastify.get('/monitorChanges', (request, reply) => {
  console.log('monitorChanges activated');
  reply.sse(
    (async function* () {
      for await (const event of on(eventEmitter, 'change_event')) {
        let { id, ...data } = event.pop();
        console.log('yielding', id, data);
        yield {
          id,
          data: JSON.stringify(data),
        };
      }
    })(),
  );
});

fastify.register(bookingsRoutes, { prefix: `${sitePrefix}bookings` });
fastify.register(authRoutes, { prefix: `${sitePrefix}auth` });

// !Run the server!
const runit = async () => {
  try {
    await fastify.listen(4444);
  } catch (err) {
    fastify.log.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
  console.log(
    `version:${version}. Listening on ${JSON.stringify(fastify.server.address())}:${
      fastify.server.address().port
    }`,
  );
};
runit();
