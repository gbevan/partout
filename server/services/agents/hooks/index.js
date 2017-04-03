/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:agents', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:agents', access: 'RW'})
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:agents', access: 'RW'})
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:agents', access: 'RW'})
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:agents', access: 'RW'})
  ],
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    (hook) => {
      hook.app.service('agents_all').emit('created', []); // tell agents_all
    }
  ],
  update: [
    (hook) => {
      hook.app.service('agents_all').emit('updated', []); // tell agents_all
    }
  ],
  patch: [
    (hook) => {
      hook.app.service('agents_all').emit('patched', []); // tell agents_all
    }
  ],
  remove: [
    (hook) => {
      hook.app.service('agents_all').emit('removed', []); // tell agents_all
    }
  ],
};
