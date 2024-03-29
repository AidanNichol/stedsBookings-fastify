const { User } = require("../../models");
const bcrypt = require("bcryptjs");
const getenv = require("getenv");
const str = (data) => JSON.stringify(data);
async function authRoutes(fastify) {
	fastify.register(require("fastify-cookie"));
	fastify.register(require("fastify-session"), {
		// the name of the session cookie, defaults to 'session'
		cookieName: "stEdsBookings",
		secret: getenv("SECRET"),
		// salt: getenv('SALT'),
		cookie: {
			path: "/",
			// options for setCookie, see https://github.com/fastify/fastify-cookie
		},
	});
	fastify.post("/login", async (request, reply) => {
		const { username, password } = request.body;
		fastify.log.warn(`${str(request.body)}, ${username}, password`);
		try {
			// await request.session.delete();

			const user = await User.findOne({
				where: { username: username },
			});
			fastify.log.info("User:", str(user));
			if (!user) {
				return { authError: `unknown username: ${username}` };
			}
			const ok = bcrypt.compareSync(password, user.password);
			if (!ok) {
				return { authError: "invalid username/password" };
			}
			user.roles = user.roles.split(/, ?/);
			let data = { ok, username, roles: user.roles };
			request.session.data = data;
			reply.send(data);
		} catch (err) {
			console.warn(err);
			throw new Error(err);
		}
	});
	fastify.get("/login", async (request, reply) => {
		const { username, password } = request.query;
		fastify.log.warn(`${str(request.query)}, ${username}, password`);
		try {
			// await request.session.delete();

			const user = await User.findOne({
				where: { username: username },
			});
			fastify.log.info("User:", str(user));
			if (!user) {
				return { authError: `unknown username: ${username}` };
			}
			const ok = bcrypt.compareSync(password, user.password);
			if (!ok) {
				return { authError: "invalid username/password" };
			}
			user.roles = user.roles.split(/, ?/);
			let data = { ok, username, roles: user.roles };
			request.session.data = data;
			reply.send(data);
		} catch (err) {
			console.warn(err);
			throw new Error(err);
		}
	});

	fastify.get("/logCheck", async (request, reply) => {
		const data = await request.session.data;
		fastify.log.info("logCheck", str(data));
		if (!data) {
			reply.send({ ok: false, authError: "not logged in" });
			return;
		}
		// return data;
		reply.send(data);
	});

	fastify.get("/logout", async (request, reply) => {
		await request.destroySession();
		reply.send({ text: "logged out" });
	});
}
module.exports = { authRoutes };
