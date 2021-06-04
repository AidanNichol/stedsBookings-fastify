const passport = require('fastify-passport');
const fs = require('fs');
const queries = require('../db/queries/users');

async function authRoutes(fastify, options) {
  fastify.get('/auth/register', async (request, reply) => {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('./server/views/register.html');
  });

  fastify.post('/auth/register', async (request, reply) => {
    await queries.addUser(ctx.request.body);
    return passport.authenticate('local', (err, user, info, status) => {
      if (user) {
        ctx.login(user);
        ctx.redirect('/auth/status');
      } else {
        ctx.status = 400;
        ctx.body = { status: 'error' };
      }
    })(ctx);
  });

  fastify.get('/auth/login', async (request, reply) => {
    if (!ctx.isAuthenticated()) {
      ctx.type = 'html';
      ctx.body = fs.createReadStream('./server/views/login.html');
    } else {
      ctx.redirect('/auth/status');
    }
  });

  fastify.post('/auth/login', async (request, reply) => {
    return passport.authenticate('local', (err, user, info, status) => {
      if (user) {
        console.log(
          'post/auth/login',
          JSON.stringify(user),
          ctx.isAuthenticated(),
          ctx.state.user,
        );
        ctx.login(user);
        ctx.redirect('/auth/status');
      } else {
        ctx.status = 400;
        ctx.body = { status: 'error' };
      }
    })(ctx);
  });

  fastify.get('/auth/logout', async (request, reply) => {
    if (ctx.isAuthenticated()) {
      ctx.logout();
      ctx.redirect('/auth/login');
    } else {
      ctx.body = { success: false };
      ctx.throw(401);
    }
  });

  fastify.get('/auth/status', async (request, reply) => {
    if (ctx.isAuthenticated()) {
      ctx.type = 'html';
      ctx.body = fs.createReadStream('./server/views/status.html');
    } else {
      ctx.redirect('/auth/login');
    }
  });
}
module.exports = { authRoutes };
