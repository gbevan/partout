/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      _ = require('lodash');

const debug = require('debug').debug('partout:service:environments:hooks');

const HIDDEN = '[...HIDDEN...]';

function protectKey(options) {
  return (hook) => {
    return new Promise((resolve, reject) => {
      const e = hook.data;
      if (e.keyType === 'text' && (e.key === HIDDEN || e.key === '')) {
        hook.app.service('environments')
        .get(e.id)
        .then((old_e) => {
          e.key = old_e.key;
          debug('cleansed e:', e);
          resolve(hook);
        })
        .catch((err) => {
          reject(err);
        });
      } else {
        debug('not cleansed e:', e);
        resolve(hook);
      }
    });
  };
}

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'})
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'}),
    protectKey()
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'}),
    protectKey()
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'})
  ],
};

exports.after = {
  all: [
    (hook) => {
      if (hook.params && hook.params.provider) {
        if (_.isArray(hook.result)) {
          hook.result.forEach((r) => {
            if (r.keyType === 'text' && r.key !== '') {
              r.key = HIDDEN;
            }
          });
        } else {
          const r = hook.result;
          if (r.keyType === 'text' && r.key !== '') {
            r.key = HIDDEN;
          }
        }
      }
      return Promise.resolve(hook);
    }
  ],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [],
};
