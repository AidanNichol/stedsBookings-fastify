const models = require("../../../models");

// const { todaysDate: today } = require('./dateFns');
// const _ = require('lodash');

async function UserRoutes(fastify) {
	fastify.post("/get/:userName", async (req) => {
		let { username } = req.params;
		return await models.User.findOne({
			where: { username: username },
		});
	});
	fastify.post("/update/:userName", async (req) => {
		let { username } = req.params;

		const body = JSON.parse(req.body);
		const [user, created] = await models.User.findOrCreate({
			where: { username: username },
			defaults: body,
		});
		console.log(user.username, created);
		if (!created) {
			await models.User.update(body, { where: { username } });
		}
	});
}
module.exports = { UserRoutes };
