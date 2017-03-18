/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      ca = new (require('../../../../lib/ca'))();

const debug = require('debug').debug('partout:service:csrs');

exports.before = {
  all: [
    auth.authenticate('jwt')
  ],
  find: [
    (hook) => { // allow client to disable pagination
      hook.service.paginate = false;
    }
  ],
  get: [],
  create: [],
  update: [],
  patch: [],
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
