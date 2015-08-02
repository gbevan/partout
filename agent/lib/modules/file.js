/*jslint node: true, nomen: true */
'use strict';

/*********************************************************************
 * File module
 * ~~~~~~~~~~~
 *
 * p2.node([...])
 *   .file('file or title', options, function (err, stdout, stderr) { ... });
 *
 * Options (from https://nodejs.org/api/child_process.html):
 *
 *   -
 *
 * also supports:
 *   -
 *
 * TODO: remaining support
 *   -
 */

var _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec;

var File = function (cmd, opts, cb) {
  var self = this;  // self is parents _impl

  if (!opts) {
    opts = {};
  }

  if (typeof (opts) === 'function') {
    cb = opts;
    opts = {};
  }

  //console.log('Queing on node "' + node + '", cmd:', cmd);
  self.steps.push(function (callback) {

    console.log('File on node "' + os.hostname() + '", cmd:', cmd, ', opts:', JSON.stringify(opts));

  });
  return self;
};

File.getName = function () { return 'file'; };


module.exports = File;
