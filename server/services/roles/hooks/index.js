/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks;

const debug = require('debug').debug('partout:service:roles:hooks');

function ensureNameUnique(options) {
  return (hook) => {
    return new Promise((resolve, reject) => {
      const r = hook.data;

      hook.app.service('roles')
      .find({query: {name: r.name}})
      .then((other_r) => {
        debug('other_r:', other_r);
        if (other_r.total > 0) {
          return reject(new Error('Duplicate entry for name'));
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
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'RW'}),
    ensureNameUnique()
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'RW'})
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'RW'})
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'RW'})
  ],
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [],
};
