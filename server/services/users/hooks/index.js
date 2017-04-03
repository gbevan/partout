/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      local = require('feathers-authentication-local'),
      auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    local.hooks.hashPassword({ passwordField: 'password' }),
    globalHooks.hasPermission({permission: 'app:service:users', access: 'RW'})
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
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [],
};
