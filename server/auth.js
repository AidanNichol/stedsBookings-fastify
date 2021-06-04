const passport = require('fastify-passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// const knex = require('./db/connection');
const models = require('../models');

const options = {};

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await models.User.findByPk(id);

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
});

passport.use(
  new LocalStrategy(options, async (username, password, done) => {
    try {
      const user = await models.User.findOne({ where: { username } });

      if (!user) return done(null, false);
      if (!comparePass(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }),
);
try {
} catch (error) {}
