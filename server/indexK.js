const Koa = require('koa');
const https = require('https');
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const passport = require('koa-passport');
const cors = require('koa2-cors');
// const websockify = require('koa-wss');
const Router = require('koa-router');
const router = new Router();

require('./db/sockets');

// const addSockets = require('./db/socketsA');
console.log('what!!');
const indexRoutes = require('./routes/index');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const config = require('dotenv').config().parsed;

// const env = process.env.NODE_ENV || 'development';

// const config = require('../config/config.json')[env];
const file = (name) =>
  fs.readFileSync(path.resolve(process.cwd(), name), 'utf8').toString();
// SSL
const httpsOptions = {
  key: file(config.key),
  cert: file(config.cert),
};
// const app = websockify(new Koa(), {}, httpsOptions);
const app = new Koa();
const PORT = process.env.PORT || config.port;

// sessions
app.keys = ['super-secret-key'];
app.use(cors({origin:['*'], exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],}));
app.use(session(app));

// body parser
app.use(bodyParser());

// authentication
require('./auth');
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use(indexRoutes.routes());
app.use(authRoutes.routes());
app.use(bookingRoutes.routes());
// app.ws.use(async (ctx, next) => {
//   console.log('use', ctx);
//   // the websocket is added to the context as `ctx.websocket`.
//   // await bananas();
//   ctx.websocket.on('message', function (message) {
//     console.log('ws message', message);
//     // do something
//   });
// });

// server
// const server = https.createServer(options, app.callback()).listen(PORT, () => {
//   console.log(`Server listening on port: ${PORT}`);
// });
const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
  console.warn(`Server is listening on port: ${PORT}`);
  console.error(`Server really is listening on port: ${PORT}`);
});

// addSockets(server);

module.exports = server;
