/*jshint node: true*/
'use strict';

const _ = require('lodash');

const debug = require('debug').debug('partout:hooks');

exports.example = (options) => {
  return function (hook) {
    // custom global hook
    // return Promise.resolve(hook), or
    // return Promise.reject(err)
  };
};

/**
 * before hook to check user has a permission
 * options.permission = 'app:service:agents:R'
 * options.access = 'R' or 'RW'
 */
exports.hasPermission = (options) => {
  return function (hook) {
    return new Promise((resolve, reject) => {
//      debug('hook:', hook);
//      debug('params:', hook.params);
//      debug('user:', hook.params.user);
      if (!options || !options.permission) {
        return resolve(hook);
      }

      // if called internally
      if (!hook.params.provider) {
        return resolve(hook);
      }
//
//      if (!hook.params.user) {
//
//      }

      if (!hook.params.user || !hook.params.user.permissions[options.permission]) {
        return reject(new Error(`Request ${hook.method}:${hook.path} Not Authorised for ${options.permission}`));
      }

      if (options.access) {
        if (!_.includes(hook.params.user.permissions[options.permission], options.access)) {
          return reject(new Error(`Request ${hook.method}:${hook.path} Access Not Authorised for ${options.access} in granted permission ${options.permission}`));
        }
      }

      resolve(hook);
    });
  };
};
