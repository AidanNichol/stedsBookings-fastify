const bcrypt = require('bcryptjs');
let userData = require('./userData.js');

// const knex = require('./db/connection');
const models = require('../models/index');
const saltRounds = 10;
// userData = userData.slice(-1);
userData.forEach((u) => {
  const hash = bcrypt.hashSync(u.password, saltRounds);
  u.password = hash;
});
models.User.bulkCreate(userData).then(async () => {
  console.log(`User count: ${await models.User.count()}`);
});
