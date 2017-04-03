/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      ca = new (require('../../../../lib/ca'))();

const debug = require('debug').debug('partout:service:csrs');

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'R'})
  ],
  find: [
    (hook) => { // allow client to disable pagination
      hook.service.paginate = false;
    }
  ],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:csrs', access: 'RW'})
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
