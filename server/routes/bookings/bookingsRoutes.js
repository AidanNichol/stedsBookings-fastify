const { accountRoutes } = require("./accountRoutes.js");
// const authRoutes = require('../authRoutes.js');
const { walkRoutes } = require("./walkRoutes.js");
const { bankingRoutes } = require("./bankingRoutes.js");
const bookingRoutes = require("./bookingRoutes.js");
const paymentRoutes = require("./paymentRoutes.js");
const { memberRoutes } = require("./memberRoutes.js");
const updates = require("../../db/queries/updates");

async function bookingsRoutes(fastify) {
	// // fastify.register(authRoutes, { prefix: 'auth' });
	fastify.register(accountRoutes, { prefix: "account" });
	fastify.register(walkRoutes, { prefix: "walk" });
	fastify.register(memberRoutes, { prefix: "member" });
	fastify.register(bankingRoutes, { prefix: "banking" });
	fastify.register(paymentRoutes, { prefix: "payment" });
	fastify.register(bookingRoutes, { prefix: "booking" });
	fastify.post("/patches", async (request, reply) => {
		const data = await updates.withPatches(request.body);
		reply.code(201).send(data);
	});
	fastify.get("/patches", async (request, reply) => {
		// the body of the request has been encoded in JSON
		// and then base64 encoded so it can be passed as a query string
		// in the GET URL request
		let bufferObj = Buffer.from(request.query.body, "base64");
		const query = JSON.parse(bufferObj.toString("utf8"));
		const data = await updates.withPatches(query);
		reply.code(201).send(data);
	});
}
module.exports = bookingsRoutes;
