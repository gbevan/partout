/*jslint node: true, nomen: true, vars: true*/
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
 *   - path: file path, overrides title
 *   - ensure: present, absent, file, directory, link
 *
 * also supports:
 *   -
 *
 * TODO: remaining support
 *   -
 */

var console = require('better-console'),
  _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec;

var File = function (title, opts, cb) {
  var self = this;  // self is parents _impl
  console.log('file self:', self);
  console.log('file self.steps:', self.steps);

  if (!opts) {
    opts = {};
  }

  if (typeof (opts) === 'function') {
    cb = opts;
    opts = {};
  }

  //console.log('Queing on node "' + node + '", cmd:', cmd);
  self.steps.push(function (callback) {

    var file = title,
      msg;

    if (opts.path) {
      file = opts.path;
    }

    console.log('File on node "' + os.hostname() + '", file:', title, ', opts:', JSON.stringify(opts));

    fs.lstat(file, function (err, stats) {

      console.warn('err:', err, 'stats:', stats);

      if (opts.ensure) {
        switch (opts.ensure) {
        case 'present':
          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);
            fs.openSync(file, 'w');
          }
          break;

        case 'absent':
          if (!err && stats) {
            if (stats.isDirectory()) {
              console.warn('Deleting directory', file);
              fs.rmdirSync(file);
            } else {
              console.warn('Deleting file', file);
              fs.unlinkSync(file);
            }
          }
          break;

        case 'file':
          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);
            fs.openSync(file, 'w');
          }
          break;

        case 'directory':
          if (err && err.code === 'ENOENT') {
            console.warn('Creating directory', file);
            fs.mkdirSync(file);
          } else if (!stats.isDirectory()) {
            console.error('Error:', file, 'exists and is not a directory');
          }
          break;

        case 'link':
          if (!opts.target) {
            msg = 'Error: Link ' + file + ' requested but no target specified';
            console.error(msg);
            throw (new Error(msg));
          }
          if (err && err.code === 'ENOENT') {
            console.warn('Creating link', file);
            fs.symlinkSync(opts.target, file, 'file');

          } else if (err) {
            throw (err);

          } else if (!stats.isDirectory()) {
            console.error('Error:', file, 'exists and is not a directory');
          }
          break;

        default:
          msg = 'Error: ensure ' + opts.ensure + ' is not supported';
          console.error(msg);
          throw (new Error(msg));
        }
      }

      callback();

    }); // fs.stat

  });
  return self;
};

File.getName = function () { return 'file'; };


module.exports = File;
