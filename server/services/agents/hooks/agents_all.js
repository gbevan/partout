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
  find: [
    (hook) => { // allow client to disable pagination
      hook.service.paginate = false;

      // handle lastSeenBucket
      if (hook.params.query.$select) {
        hook.params.query.$select = hook.params.query.$select.map((x) => {
          return x === 'lastSeenBucket' ? 'lastSeen' : x;
        });
      }
    }
  ],
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
  find: [
    (hook) => {
      hook.result.forEach(function (r) {
        if (r.lastSeen === undefined) {
          return;
        }
        let n = Date.now(); // millisecs since 1970
        let aday = 1000 * 60 * 60 * 24;
        let lastSeen = Date.parse(r.lastSeen);

        if (lastSeen > (n - aday) ) {
          r.lastSeenBucket = '< 1 day';

        } else if (lastSeen > (n - aday * 2)) {
          r.lastSeenBucket = '< 2 days';

        } else if (lastSeen > (n - aday * 5)) {
          r.lastSeenBucket = '< 5 days!';

        } else if (lastSeen > (n - aday * 31)) {
          r.lastSeenBucket = '< 31 days!!';

        } else {
          r.lastSeenBucket = '> 31 days!!!';
        }
      });
    }
  ],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: [],
};
