/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.authenticate('jwt')
  ],
  find: [
    (hook) => { // allow client to disable pagination
      hook.service.paginate = false;

      // handle lastSeenBucket
      hook.params.query.$select = hook.params.query.$select.map(x => { return x === 'lastSeenBucket' ? 'lastSeen' : x; });
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
