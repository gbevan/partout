/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const cfg = new (require('../../../etc/partout.conf.js'))(),
      authentication = require('feathers-authentication'),
      jwt = require('feathers-authentication-jwt'),
      local = require('feathers-authentication-local');

const debug = require('debug').debug('partout:service:authentication');

function customizeJWTPayload() {
  return function(hook) {
    debug('Customizing JWT Payload, hook.params:', hook.params);
    hook.data.payload = {
      // You need to make sure you have the right id.
      // You can put whatever you want to be encoded in
      // the JWT access token.
      userId: hook.params.user._key
    };

    return Promise.resolve(hook);
  };
}

module.exports = function() {
  const app = this;

//  let config = app.get('auth');

  app.configure(authentication({
    secret: cfg.token.secret,
    cookie: {
      maxAge: 1000 * 60 * 60 * 25 // 1 day
    },
    session: false
  }));

  app.configure(local({
    name: 'local',
    usernameField: 'username'
  }));
  app.configure(jwt());

  app.service('authentication').hooks({
    before: {
      create: [
        authentication.hooks.authenticate(['jwt', 'local']),
        customizeJWTPayload()
      ],
      remove: [
        authentication.hooks.authenticate('jwt')
      ]
    }
  });
};
