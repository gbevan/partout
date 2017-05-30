/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      local = require('feathers-authentication-local'),
      auth = require('feathers-authentication').hooks;
//      { remove, when } = require('feathers-hooks-common');

const debug = require('debug').debug('partout:service:users:hooks');

function ensureNameUnique(options) {
  return (hook) => {
    return new Promise((resolve, reject) => {
      const u = hook.data;

      hook.app.service('users')
      .find({query: {username: u.username}})
      .then((other_u) => {
        debug('other_u:', other_u);
        if (other_u.total > 0) {
          return reject(new Error('Duplicate entry for username'));
        }
        resolve(hook);
      })
      .catch((err) => {
        reject(err);
      });
    });
  };
}

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    local.hooks.hashPassword({ passwordField: 'password' }),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'RW'}),
    ensureNameUnique()
  ],
  update: [
    local.hooks.hashPassword({ passwordField: 'password' }),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'RW'})
  ],
  patch: [
    local.hooks.hashPassword({ passwordField: 'password' }),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'RW'})
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:users', access: 'RW'})
  ],
};

exports.after = {
  all: [
//    when((hook) => hook.params.provider, remove('password'))
    hooks.remove('password')  // TODO: deprecated
  ],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [],
};
