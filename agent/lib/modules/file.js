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
  function _ensure_content(file, data, is_template) {
    var f_hash = utils.hashFileSync(file);

    console.log('_ensure_content file:', file, ' data:', data);

    if (typeof(data) === 'object') {
      if (data.file) {
        _ensure_file(file, data.file, is_template);
      } else if (data.template) {
        _ensure_file(file, data.template, true);
      }
      return;
    }

    if (is_template) {
      data = Mustache.render(data, p2.facts);
    }

    var d_hash = utils.hash(data);
    console.log('File: comparing file hash:', f_hash, '-> content hash:', d_hash);
    if (f_hash != d_hash) {
      console.warn('File: updating file content');
      fs.writeFileSync(file, data);
    }
  }

  function _ensure_file(file, srcfile, is_template) {
    console.log('_ensure_file(' + file + ',', srcfile + ')');
    var data = fs.readFileSync(srcfile).toString();
    console.log('data:', data);
    _ensure_content(file, data, is_template);
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
      var fd,
        mode_prefix = '';

      console.warn('err:', err, 'stats:', stats);

      if (opts.ensure) {
        switch (opts.ensure) {
        case 'present':
          mode_prefix = '100';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);
            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
          }
          console.log('**** content:', typeof(opts.content));
          if (opts.content !== undefined) {
            _ensure_content(file, opts.content, opts.is_template);
          }

          break;

        case 'file':
          mode_prefix = '100';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);
            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
          }
          console.log('**** content:', typeof(opts.content));
          if (opts.content !== undefined) {
            _ensure_content(file, opts.content, opts.is_template);
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
          callback();
          return;

        case 'directory':
          mode_prefix = '040';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating directory', file);
            fs.mkdirSync(file);
          } else if (!stats.isDirectory()) {
            console.error('Error:', file, 'exists and is not a directory');
          }
          break;

        case 'link':
          mode_prefix = '120';

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
            console.error('Error:', file, 'exists and is not a link');
          }
          break;

        default:
          msg = 'Error: ensure ' + opts.ensure + ' is not supported';
          console.error(msg);
          throw (new Error(msg));
        }
      } // if ensure

      stats = fs.lstatSync(file);

      if (opts.mode && typeof(opts.mode) === 'string') {
        if (opts.mode.match(/^0[0-9]{3}$/)) {
          var m = parseInt(mode_prefix + opts.mode.slice(1), 8);
          console.log('File: mode', stats.mode.toString(8), 'should be', m.toString(8));
          fs.chmodSync(file, m);
        }
      }

      callback();

    }); // fs.stat

  });
  return self;
};

File.getName = function () { return 'file'; };


module.exports = File;
