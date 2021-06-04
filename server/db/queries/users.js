const bcrypt = require('bcryptjs');
// const knex = require('../connection');
const models = require('../../../models');
function addUser(user) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(user.password, salt);
  return models.User.create({
    username: user.username,
    password: hash,
    roles: '',
  });
}

module.exports = {
  addUser,
};
