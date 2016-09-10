/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
/*global p2 */
'use strict';

var console = require('better-console'),
    u = require('util'),
    P2M = require('../../p2m'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    utils = require('../../utils'),
    pfs = require('../../pfs'),
    Mustache = require('mustache'),
    Q = require('q');

Q.longStackSupport = true;
Q.onerror = function (err) {
  console.error(err);
  console.error(err.stack);
};

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
 *   | mode        | String  | Octal file mode                        |
 *   | owner       | String  | Owner of this file object              |
 *   | group       | String  | Group owner of this file object        |
 *   | watch       | Boolean | Watch this file object for changes and reapply policy |
 *
 *   Templates use the [Mustache](https://www.npmjs.com/package/mustache) templating library.
 *
 * ---
 * also supports:
 *
 * Watches for real-time reapplication of policy when a file object is changed
 *
 *     .watch(true)
 *     .file('your_file_to_watch', {ensure: 'file', content: 'template_file'})
 *     .watch(false)
 *     ...
 *
 * ---
 */

var File = P2M.Module(module.filename, function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('file')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      p2module: {
        file: {
          loaded: true
        }
      }
    };
    deferred.resolve(facts);
  })

  //////////////////
  // Action handler
  .action(function (args) {

    var deferred = args.deferred,
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        cb = args.cb, // cb is policy provided optional call back on completion
        errmsg = '',
        file = title;

    opts.ensure = (opts.ensure ? opts.ensure : 'present');

    if (opts.path) {
      file = opts.path;
    }

    self.opts = opts;
    self.title = title;

    var _watch_state = (opts.watch ? true : _impl._watch_state);

    fs.lstat(file, function (err, stats) {
      var fd,
          mode_prefix = '',
          ensure_deferred = Q.defer();

      if (err) {
        utils.dlog('lstat:', err);
      } else {
        utils.dlog('lstat:', stats);
      }

      utils.vlog('file: %s opts %s', file, u.inspect(opts, {colors: true, depth: 3}));

      // Handle ensure option
      self._opt_ensure(file, opts, err, stats, _impl, inWatchFlag, deferred)
      .then(function (changed) {

        fs.lstat(file, function (err, stats) {

          // Handle mode option
          self._opt_mode(file, opts, stats, _impl)
          .then(function () {
            // Handle owner option
            return self._opt_owner(file, opts, stats, _impl);
          })
          .then(function () {
            // Handle group option
            return self._opt_group(file, opts, stats, _impl);
          })
          .done(function () {

            if (!inWatchFlag && _watch_state && global.p2_agent_opts.daemon) {
              utils.dlog('>>> Starting watcher on file:', file);
              _impl.P2_watch(file, function (next_event_cb) { // watch_action_fn from P2_watch()
                utils.dlog('-Watcher Triggered>>>--------------------------------');
                utils.dlog('watcher triggered. file:', file, 'this:', this);
                var watch_action_deferred = Q.defer();

                //self.action (cb, true);
                (self.getActionFn()) ({
                  deferred: watch_action_deferred,
                  inWatchFlag: true,
                  _impl: _impl,
                  title: title,
                  opts: opts,
                  cb: function () {}  // dummy cb
                });

                watch_action_deferred.promise
                .then(function () {
                  //next_event_cb(utils.makeCallbackEvent(_impl.facts, o)); // next watch event
                  next_event_cb(); // next watch event
                })
                .done();

              });
            }

            if (cb) {
              cb(changed);
            }
            var result = {};
            if (changed) {
              result.result = 'changed';
            }
            deferred.resolve(result);

          }); // _opt_mode

        }); // inner fs.stat

      })

      .done(null, function (err) {
        //console.warn('file action err:', err);
        deferred.reject(err);
      }); // ensure_deferred

    }); // fs.stat



  }) // .action ()
  ;

});

/**
 * ensure contents match
 * @param {String}  file        file name
 * @param {String}  data        file content (can be a template)
 * @param {Boolean} is_template is this a template
 * @returns {Object}  Promise - resolves to record string
 */
File.prototype._ensure_content = function (file, data, is_template) {
  var self = this,
      f_hash = pfs.hashFileSync(file),
      record = '',
      deferred = Q.defer();

  utils.dlog('_ensure_content file:', file, ' data:', data);

  if (typeof(data) === 'object') {
    if (data.file) {
      return self._ensure_file(file, data.file, is_template);

    } else if (data.template) {
      return self._ensure_file(file, data.template, true);
    }
  }

  if (is_template) {
    data = Mustache.render(data, {title: self.title, opts: self.opts, f: p2.facts});
  }

  var d_hash = pfs.hash(data);
  if (f_hash != d_hash) {
    console.info(u.format('File: %s: updating file, hash: %s -> content hash: %s', file, f_hash, d_hash));
    //console.warn('File: updating file content:\n' + data);
    pfs.pWriteFile(file, data)
    .done(function () {
      deferred.resolve('Content Replaced. ');
    });
  } else {
    // hashes match
    deferred.resolve();
  }

  return deferred.promise;
};

/**
 * ensure file matches
 * @param {String}  file        file name
 * @param {String}  srcfile     source file (can be a template)
 * @param {Boolean} is_template is this a template
 * @returns {Object}  Promise (from _ensuere_content) resolves to record string
 */
File.prototype._ensure_file = function (file, srcfile, is_template) {
  var self = this,
      deferred = Q.defer();

  utils.dlog('_ensure_file(' + file + ',', srcfile + ')');
  pfs.pReadFile(srcfile)
  .then(function (data) {
    data = data.toString();
    utils.dlog('data:', data);
    deferred.resolve(self._ensure_content(file, data, is_template));
  })
  .done(null, function (err) {
    //console.warn('in file _ensure_file error handler');
    deferred.reject(err);
  });

  return deferred.promise;
};

/**
 * Handle the ensure option
 * @param   {string}  file        filename
 * @param   {object}  opts        file options
 * @param   {object}  err         err from stat
 * @param   {object}  stats       stats
 * @param   {object}  _impl       DSL
 * @param   {boolean} inWatchFlag flag in watch
 * @param   {object}  deferred    Q deferred object to resolve
 * @returns {object}  ensure_promise - boolean true = action taken, else false
 */
File.prototype._opt_ensure = function (file, opts, err, stats, _impl, inWatchFlag, deferred) {
  var self = this,
      ensure_deferred = Q.defer(),
      msg;

  if (opts.ensure) {
    _impl.P2_unwatch(file);

    switch (opts.ensure) {

      // TODO: make async !!!!
      case 'absent':
        if (!err && stats) {
          if (stats.isDirectory()) {
            console.info('Deleting directory', file);
            pfs.pRmdir(file)
            .done(function () {
              _impl.qEvent({module: 'file', object: file, msg: 'Deleted directory.'});
              ensure_deferred.resolve(true);
            });
          } else {
            console.info('Deleting file', file);
            pfs.pUnlink(file)
            .done(function () {
              _impl.qEvent({module: 'file', object: file, msg: 'Deleted file.'});
              //ensure_deferred.resolve('Deleted file. ');
              ensure_deferred.resolve(true);
            });
          }
        } else {
          ensure_deferred.resolve(false); // no action taken
        }
        break;

      case 'present':
      case 'file':
        if (err && err.code === 'ENOENT') {
          console.info('Creating file', file);

          // Unwatch and force new watcher
          //_impl.P2_unwatch(file);
          inWatchFlag = false;

          utils.vlog('touching file:', file);
          pfs.pTouch(file)
          .done(function () {
            var record = 'Created file. ';
            utils.vlog("%s %s", record, opts.content);
            _impl.qEvent({module: 'file', object: file, msg: record});

            if (opts.content !== undefined) {
              self._ensure_content(file, opts.content, opts.is_template)
              .done(function (r) {
                if (r) {
                  _impl.qEvent({module: 'file', object: file, msg: r});
                }
                //console.log('create file');
                ensure_deferred.resolve(true);
              });
            } else {
              //ensure_deferred.resolve(record);
              ensure_deferred.resolve(true);
            }
          });
        } else {
          if (opts.content !== undefined) {
            self._ensure_content(file, opts.content, opts.is_template)
            .then(function (r) {
              if (r) {
                _impl.qEvent({module: 'file', object: file, msg: r});
              }
              //console.log('update file r: ' + r);
              ensure_deferred.resolve(r !== undefined && r !== '');
            })
            .done(null, function (err) {
              //console.warn('file action after _ensure_content err:', err);
              ensure_deferred.reject(err);
            })
            ;
          } else {
            //ensure_deferred.resolve(record);
            ensure_deferred.resolve(false);
          }
        }
        break;

      case 'directory':
        if (err && err.code === 'ENOENT') {
          console.info('Creating directory', file);
          pfs.pMkdir(file)
          .done(function () {
            _impl.qEvent({module: 'file', object: file, msg: 'Created directory. '});
            ensure_deferred.resolve(true);
          });
        } else if (!stats.isDirectory()) {
          console.error('Error:', file, 'exists and is not a directory');
          ensure_deferred.resolve(false);
        } else {
          ensure_deferred.resolve(false); // no action taken
        }
        break;

      case 'link':
        if (!opts.target) {
          msg = 'Error: Link ' + file + ' requested but no target specified';
          console.error(msg);
          throw (new Error(msg));
        }
        if (err && err.code === 'ENOENT') {
          console.info('Creating link', file);
          pfs.pSymlink(opts.target, file, 'file')
          .done(function () {
            _impl.qEvent({module: 'file', object: file, msg: 'Created link. '});
            ensure_deferred.resolve(true);
          });
        } else if (err) {
          throw (err);

        } else if (!stats.isSymbolicLink()) {
          console.error('Error:', file, 'exists and is not a link');
          _impl.qEvent({module: 'file', object: file, level: 'error', msg: 'Exists and is not a link'});
          ensure_deferred.resolve(false);
        } else {
          ensure_deferred.resolve(false); // no action taken
        }
        break;

      default:
        msg = 'Error: ensure ' + opts.ensure + ' is not supported';
        console.error(msg);
        throw (new Error(msg));
    } // switch opts.ensure
  } else {
    ensure_deferred.resolve(false); // done nothing
  } // if ensure

  return ensure_deferred.promise;
};  //ensure


/**
 * Handle mode option
 * @param   {string}  file  filename
 * @param   {object}  opts  options
 * @param   {object}  err   err from stat
 * @param   {object}  stats stats
 * @param   {object}  _impl DSL
 * @returns {Promise} mode_deferred
 */
File.prototype._opt_mode = function (file, opts, stats, _impl) {

  var mode_deferred = Q.defer(),
      sent_chmod = false;

  utils.dlog('_opt_mode stats:', stats);

  if (stats) {
    var mode_prefix = stats.mode.toString(8).slice(0,3);

    if (opts.mode && typeof(opts.mode) === 'string') {
      if (opts.mode.match(/^0[0-9]{3}$/)) {
        var m = parseInt(mode_prefix + opts.mode.slice(1), 8); // as octal
        if (m !== stats.mode) {
          console.info('File:', file, 'chmod mode', stats.mode.toString(8), '->', m.toString(8));
          pfs.pChmod(file, m)
          .done(function () {
            _impl.qEvent({
              module: 'file',
              object: file,
              msg: 'Changed mode from ' + stats.mode.toString(8) + ' to ' + m.toString(8) + '. '
            });
            mode_deferred.resolve();
          });
          sent_chmod = true;
        }
      }
    }
  } // if stats
  if (!sent_chmod) {
    mode_deferred.resolve();
  }

  return mode_deferred.promise;
};

/**
 * Handle owner option
 * @param   {string}  file  filename
 * @param   {object}  opts  options
 * @param   {object}  err   err from stat
 * @param   {object}  stats stats
 * @param   {object}  _impl DSL
 * @returns {Promise} mode_deferred
 */
File.prototype._opt_owner = function (file, opts, stats, _impl) {

  var deferred = Q.defer();

  utils.dlog('_opt_owner stats:', stats);

  if (opts.owner && stats) {
    pfs.pGetUid(opts.owner)
    .done(function (usid) {  // UID or SID (windows)
      utils.dlog('file index usid:', usid);

      if (usid !== stats.uid.toString()) {
        utils.vlog('File: owner', stats.uid, 'should be', usid);
        pfs.pChown(file, usid, stats.gid)
        .done(function () {
          _impl.qEvent({
            module: 'file',
            object: file,
            msg: 'Changed owner from ' + stats.uid + ' to ' + usid + '.'
          });
          stats.uid = usid;
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }

    });
  } else {
    deferred.resolve();
  } // if stats & owner

  return deferred.promise;
};

/**
 * Handle group option
 * @param   {string}  file  filename
 * @param   {object}  opts  options
 * @param   {object}  err   err from stat
 * @param   {object}  stats stats
 * @param   {object}  _impl DSL
 * @returns {Promise} mode_deferred
 */
File.prototype._opt_group = function (file, opts, stats, _impl) {

  var deferred = Q.defer();

  utils.dlog('_opt_group stats:', stats);

  if (opts.group && stats) {
    pfs.pGetGid(opts.group)
    .done(function (gsid) {  // GID or SID (windows)

      if (gsid !== stats.gid.toString()) {
        utils.vlog('File: group', stats.gid, 'should be', gsid);
        pfs.pChown(file, stats.uid, gsid)
        .done(function () {
          _impl.qEvent({
            module: 'file',
            object: file,
            msg: 'Changed group from ' + stats.gid + ' to ' + gsid + '.'
          });
          stats.gid = gsid;
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }

    });
  } else {
    deferred.resolve();
  } // if stats & group

  return deferred.promise;
};


module.exports = File;
