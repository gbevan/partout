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
 *   - content: String, content of file
 *
 * also supports:
 *   -
 *
 * TODO: remaining support
 *   -
 */

/*global p2 */

var console = require('better-console'),
  _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  utils = new (require('../utils'))(),
  Mustache = require('mustache');
  //exec = require('child_process').exec;

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

  /********************
   * internal methods
   */

  // ensure contents match
  function _ensure_content(file, data) {
    var f_hash = utils.hashFileSync(file);
    data = Mustache.render(data, p2.facts);
    var d_hash = utils.hash(data);
    console.log('File: comparing file hash:', f_hash, '-> content hash:', d_hash);
    if (f_hash != d_hash) {
      console.warn('File: updating file content');
      fs.writeFileSync(file, data);
    }
  }

  /********************
   * push actions
   */
  self.steps.push(function (callback) {

    var file = title,
      msg;

    if (opts.path) {
      file = opts.path;
    }

    console.log('File on node "' + os.hostname() + '", file:', title, ', opts:', JSON.stringify(opts));

    fs.lstat(file, function (err, stats) {
      var fd;

      console.warn('err:', err, 'stats:', stats);

      if (opts.ensure) {
        switch (opts.ensure) {
        case 'present':
          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);
            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
          }
          if (opts.content !== undefined && typeof(opts.content) === 'string') {
            _ensure_content(file, opts.content);
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
            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
          }
          if (opts.content !== undefined && typeof(opts.content) === 'string') {
            _ensure_content(file, opts.content);
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
      } // if ensure

      callback();

    }); // fs.stat

  });
  return self;
};

File.getName = function () { return 'file'; };


module.exports = File;
