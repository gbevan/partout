/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true, nomen: true, vars: true*/
'use strict';

/*global p2 */

var console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    utils = new (require('../utils'))(),
    Mustache = require('mustache'),
    Q = require('q');
  //exec = require('child_process').exec;

/**
 * @module File
 *
 * @description
 * File module
 * ===========
 *
 *     p2.node([...])
 *       .file('file or title', options, function (err, stdout, stderr) { ... });
 *
 * Options:
 *
 *   | Operand     | Type    | Description                            |
 *   |:------------|---------|:---------------------------------------|
 *   | path        | String  | File path, overrides title             |
 *   | ensure      | String  | Present, absent, file, directory, link |
 *   | content     | String  | Content of file, can be object containing {file: 'filaname'} or {template: 'template file'} |
 *   | is_template | Boolean | Content is a template                  |
 *
 *   Templates use the [Mustache](https://www.npmjs.com/package/mustache) templating library.
 *
 * ---
 * also supports:
 *
 * ---
 * TODO: remaining support
 *
 */
var File = function () {
  var self = this;
  //console.log('file self:', self);
};

File.prototype.addStep = function (_impl, title, opts, cb) {
  var self = this;
  //console.log('file watch_state on push:', self._watch_state);
  var _watch_state = self._watch_state;
  //console.log('file self.steps:', self.steps);

  if (!opts) {
    opts = {};
  }

  if (typeof (opts) === 'function') {
    cb = opts;
    opts = {};
  }

  /********************
   * Extensions to p2
   */

  /********************
   * internal methods
   */

  /**
   * ensure contents match
   * @param {String} file file name
   * @param {String} data file content (can be a template)
   * @param {Boolean} is_template is this a template
   */
  function _ensure_content(file, data, is_template) {
    var f_hash = utils.hashFileSync(file),
      record = '';

    //console.log('_ensure_content file:', file, ' data:', data);

    if (typeof(data) === 'object') {
      if (data.file) {
        return _ensure_file(file, data.file, is_template);

      } else if (data.template) {
        return _ensure_file(file, data.template, true);
      }
    }

    if (is_template) {
      //console.log('+++ template: p2.facts:', p2.facts, 'p2:', p2, 'self:', self, 'self.facts:', self.facts);
      data = Mustache.render(data, p2.facts);
    }

    var d_hash = utils.hash(data);
    console.log('File: comparing file hash:', f_hash, '-> content hash:', d_hash);
    if (f_hash != d_hash) {
      //console.warn('File: updating file content:\n' + data);
      fs.writeFileSync(file, data);
      record += 'Content Replaced. ';
    }

    return record;
  }

  /**
   * ensure file matches
   * @param {String} file file name
   * @param {String} srcfile source file (can be a template)
   * @param {Boolean} is_template is this a template
   */
  function _ensure_file(file, srcfile, is_template) {
    console.log('_ensure_file(' + file + ',', srcfile + ')');
    var data = fs.readFileSync(srcfile).toString();
    console.log('data:', data);
    return _ensure_content(file, data, is_template);
  }

  /********************
   * push actions
   */
  var action = function (callback, inWatch) {

    var file = title,
      msg,
      record = '';

    if (opts.path) {
      file = opts.path;
    }
    console.log('-------------------------------------------');
    //console.log('File on node "' + os.hostname() + '", file:', title, ', opts:', JSON.stringify(opts), 'watch_state:', _watch_state, 'self:', self);

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

            // Unwatch and force new watcher
            _impl.P2_unwatch(file);
            inWatch = false;

            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
            record += 'Created file. ';
            console.log('record:', record);
          }
          //console.log('**** content:', typeof(opts.content));
          if (opts.content !== undefined) {
            record += _ensure_content(file, opts.content, opts.is_template);
          }

          break;

        case 'file':
          mode_prefix = '100';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);

            // Unwatch and force new watcher
            _impl.P2_unwatch(file);
            inWatch = false;

            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
            record += 'Created file. ';
            console.log('record:', record);
          }
          //console.log('**** content:', typeof(opts.content));
          if (opts.content !== undefined) {
            record += _ensure_content(file, opts.content, opts.is_template);
          }
          break;

        case 'absent':
          if (!err && stats) {
            if (stats.isDirectory()) {
              console.warn('Deleting directory', file);
              fs.rmdirSync(file);
              record += 'Deleted directory. ';
            } else {
              console.warn('Deleting file', file);
              fs.unlinkSync(file);
              record += 'Deleted file. ';
            }
          }
          callback({
            module: 'file',
            object: file,
            msg: record
          });
          return;

        case 'directory':
          mode_prefix = '040';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating directory', file);
            fs.mkdirSync(file);
            record += 'Created directory. ';
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
            record += 'Created link. ';
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
          var m = parseInt(mode_prefix + opts.mode.slice(1), 8); // as octal
          if (m !== stats.mode) {
            console.log('File: mode', stats.mode.toString(8), 'should be', m.toString(8));
            fs.chmodSync(file, m);
            record += 'Changed mode from ' + stats.mode.toString(8) + ' to ' + m.toString(8) + '. ';
          }
        }
      }

      if (!inWatch && _watch_state && GLOBAL.p2_agent_opts.daemon) {
        console.log('>>> Starting watcher on file:', file);
        _impl.P2_watch(file, function (cb) {
          console.log('watcher triggered. file:', file, 'this:', this);

          action (cb, true);
        });
      }

      // TODO: pass updated status to callback
      callback({
        module: 'file',
        object: file,
        msg: record
      });

    }); // fs.stat

  };

  //self.steps.push(action);
  if (_impl.ifNode()) {
    _impl.push_action(action);
  }

  //return self;
};

/**
 * Return this module's name
 * @return {String} name of module
 */
File.getName = function () { return 'file'; };

File.prototype.getFacts = function () {
  var facts = {},
      deferred = Q.defer();
  facts.file_loaded = true;
  deferred.resolve(facts);

  return deferred.promise;
};

module.exports = File;
