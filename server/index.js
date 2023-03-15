/* eslint-disable node/no-unsupported-features/es-syntax */
// Require the framework and instantiate it
const fastifyPkg = require("fastify");
const fastifyCors = require("fastify-cors");

// const fastifyCookie = require('fastify-cookie');
// const fastifyStatic = require('fastify-static');
const multipart = require("fastify-multipart");
var { eventEmitter, on } = require("./eventEmitter");

const bookingsRoutes = require("./routes/bookings/bookingsRoutes.js");
const { authRoutes } = require("./routes/authRoutes.js");
const packageJson = require("../package.json");
const fs = require("fs");
const {
	format,
	formatISO9075,
	// addHours,
	startOfTomorrow,
	differenceInMilliseconds,
	intervalToDuration,
	formatDuration,
} = require("date-fns");
const { stdTimeFunctions } = require("pino");
const pino = require("pino");
var pretty = require("pino-pretty");
let today = format(new Date(), "yyyy-MM-dd");
var streams = [
	{ stream: fs.createWriteStream(`./logs/fastify-info.${today}.log`) },
	{ stream: pretty() },
	{
		level: "debug",
		stream: fs.createWriteStream(`./logs/fastify-debug.${today}.log`),
		timestamp: stdTimeFunctions.isoTime,
	},
	{
		level: "fatal",
		stream: fs.createWriteStream(`./logs/fastify-fatal.${today}.log`),
	},
];
let stream = pino.multistream(streams);
const http = require("http");

const serverFactory = (handler) => {
	const server = http.createServer((req, res) => {
		handler(req, res);
	});

	return server;
};
const fastify = fastifyPkg({
	serverFactory,
	logger: {
		stream,
		// level: 'info',
		// file: `./logs/fastify-${today}.log`, // will use pino.destination()
		timestamp: stdTimeFunctions.isoTime,
	},
});
// const transport = pino.transport({
// 	targets: [
// 		{
// 			target: "pino/file",
// 			options: {
// 				destination: `./logs/fastify-${today}.log`,
// 				timestamp: stdTimeFunctions.isoTime,
// 			},
// 		},
// 		{
// 			target: "pino-pretty", // logs to the standard output by default
// 		},
// 	],
// });

const version = packageJson.version;

const requestRestart = () => {
	let localTime = new Date();

	fastify.log.info(`Restart requested @ ${formatISO9075(localTime)}`);
	fs.utimesSync("./tmp/restart.txt", localTime, localTime);
};
if (fs.existsSync("./temp/started.txt")) {
	fs.unlinkSync("./tmp/started.txt");
}
let tomorrow = startOfTomorrow();
const now = new Date();
let diff = differenceInMilliseconds(tomorrow, now);
let dur = intervalToDuration({ start: now, end: tomorrow });
const durF = formatDuration(dur);
const nowF = formatISO9075(now);
const tomorrowF = formatISO9075(tomorrow);
fs.writeFileSync(
	"./tmp/started.txt",
	`${nowF} version ${version}.   Restart in ${durF} @ ${tomorrowF}`,
);
setTimeout(() => requestRestart(), diff);
// const { promisify } = require('util');
// const sleep = promisify(setTimeout);
fastify.log.info("loading");
const sitePrefix = "bookingsServer";

fastify.register(multipart, { attachFieldsToBody: true });

fastify.register(fastifyCors, {
	credentials: true,
	origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
});

fastify.register(require("fastify-sse-v2"));

fastify.get(`/${sitePrefix}/`, async () => {
	return {
		hello: "world",
		node: process.versions.node,
		version,
	};
});

let msg = "";
let lastId = null;
function report(id, data, who, reqId) {
	if (id === lastId) {
		msg = `${msg} ${reqId}`;
	} else {
		msg = `${id} ${data} ${who} ${reqId}`;
		lastId = id;
	}
	// logUpdate('yielding ', msg);
	// fastify.log.info('yielding ', msg);
}

fastify.get(`/${sitePrefix}/testsse`, () => {
	testSSE();
	return "testing sse";
});

const testSSE = () => {
	let i = 0;
	let j = 0;
	setInterval(() => {
		eventEmitter.emit("change_event", {
			event: "test",
			id: `i-${++i}`,
			other: "what",
		});
	}, 11000);
	setInterval(() => {
		eventEmitter.emit("change_event", {
			event: "test",
			id: `j-${++j}`,
			other: "why",
		});
	}, 17000);
};
const heartbeat = () => {
	let j = 0;

	setInterval(() => {
		eventEmitter.emit("change_event", {
			event: "heartbeat",
			id: `j-${++j}`,
			version,
		});
	}, 2 * 60000 - 5);
};

let reqIdNo = 0;
fastify.get(`/${sitePrefix}/monitorChanges`, (request, response) => {
	const reqId = `req-${++reqIdNo}`;
	let closed = false;
	const who = request.query.who;
	fastify.log.info("bookingsServer/monitorChanges activated", who, reqId);
	request.raw.on("close", () => {
		closed = true;
		// logUpdate.done();
		fastify.log.info("Stopped sending events.", reqId);
	});
	response.sse(
		(async function* () {
			for await (const e of on(eventEmitter, "change_event")) {
				if (closed) {
					return "\n\n";
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
	const msg = `version:${version}. Listening on 4444. Will restart in ${durF} @ ${tomorrowF}`;
	fastify.log.info(msg);
};
runit();
heartbeat();
// testSSE();
