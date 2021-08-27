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

const http = require('http');
// const { promisify } = require('util');
// const sleep = promisify(setTimeout);
console.log('loading');
const sitePrefix = 'bookingsServer';
const serverFactory = (handler) => {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  return server;
};

const fastify = fastifyPkg({
  serverFactory,
  logger: {
    level: 'info',
    file: './logs/fastify.log', // will use pino.destination()
  },
});

fastify.register(multipart, { attachFieldsToBody: true });

fastify.register(fastifyCors, {
  credentials: true,
  origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
});

fastify.register(require('fastify-sse-v2'));

fastify.get(`/${sitePrefix}/`, async () => {
  return {
    hello: 'world',
    node: process.versions.node,
    version,
  };
});

let msg = '';
let lastId = null;
function report(id, data, who, reqId) {
  if (id === lastId) {
    msg = `${msg} ${reqId}`;
  } else {
    msg = `${id} ${data} ${who} ${reqId}`;
    lastId = id;
  }
  // logUpdate('yielding ', msg);
  // console.log('yielding ', msg);
}

fastify.get(`/${sitePrefix}/testsse`, () => {
  testSSE();
  return 'testing sse';
});

const testSSE = () => {
  let i = 0;
  let j = 0;
  setInterval(() => {
    eventEmitter.emit('change_event', {
      event: 'test',
      id: `i-${++i}`,
      other: 'what',
    });
  }, 11000);
  setInterval(() => {
    eventEmitter.emit('change_event', {
      event: 'test',
      id: `j-${++j}`,
      other: 'why',
    });
  }, 17000);
};
const heartbeat = () => {
  let j = 0;

  setInterval(() => {
    eventEmitter.emit('change_event', {
      event: 'heartbeat',
      id: `j-${++j}`,
      other: 'why',
    });
  }, 2 * 60000 - 5);
};

let reqIdNo = 0;
fastify.get(`/${sitePrefix}/monitorChanges`, (request, response) => {
  const reqId = `req-${++reqIdNo}`;
  let closed = false;
  const who = request.query.who;
  console.log('bookingsServer/monitorChanges activated', who, reqId);
  request.raw.on('close', () => {
    closed = true;
    // logUpdate.done();
    console.log('Stopped sending events.', reqId);
  });
  response.sse(
    (async function* () {
      for await (const e of on(eventEmitter, 'change_event')) {
        if (closed) {
          return '\n\n';
        }
        let { id, event, ...data } = e.pop();
        data = JSON.stringify(data);
        report(id, event, data, who, reqId);
        // logUpdate.done();
        yield { id, event, data };
      }
    })(),
  );
});

fastify.register(bookingsRoutes, { prefix: `${sitePrefix}/bookings` });
fastify.register(authRoutes, { prefix: `${sitePrefix}/auth` });

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
heartbeat();
// testSSE();
