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

function populatePermissions() {
  debug('populatePermissions()');
  return function(hook) {
    return new Promise((resolve, reject) => {
      debug('populatePermissions() hook');
      hook.params.user.permissions = {};
      const user = hook.params.user,
            promises = [];

      function _getPermsForRole(role) {
        debug('populatePermissions() _getPermsForRole() role:', role);
        return hook.app.service('roles')
        .find({
          query: {
            name: role.name
          },
          paginate: false
        })
        .then((roles_res) => {
          debug('populatePermissions() roles_res:', roles_res);
          if (roles_res.length === 1) {
            roles_res[0].permissions.forEach((p) => {
              debug('populatePermissions() _getPermsForRole() p:', p);
              hook.params.user.permissions[
                (p.type || '') + ':' +
                (p.subtype || '') + ':' +
                (p.name || '')
              ] = p.access || true;
            });
            debug('hook.params.user.permissions:', hook.params.user.permissions);
          }
        });
      }

      if (!user || !user.roles) {  // not yet authenticated
        return resolve(hook);
      }

      user.roles.forEach((role) => {
        promises.push(_getPermsForRole(role));
      });
      Promise.all(promises)
      .then(() => {
        resolve(hook);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
    });
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
    },

    after: {
      create: [
        populatePermissions()
      ]
    }
  });
};
