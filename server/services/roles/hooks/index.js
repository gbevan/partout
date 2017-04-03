/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:roles', access: 'RW'})
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
