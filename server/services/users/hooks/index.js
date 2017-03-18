/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      local = require('feathers-authentication-local'),
      auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.authenticate('jwt')
  ],
  find: [],
  get: [],
  create: [
    local.hooks.hashPassword({ passwordField: 'password' })
  ],
  update: [
    local.hooks.hashPassword({ passwordField: 'password' })
  ],
  patch: [
    local.hooks.hashPassword({ passwordField: 'password' })
  ],
  remove: [],
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
