/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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

var console = require('better-console'),
  walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp'),
  Q = require('q'),
  exec = require('child_process').exec,
  _ = require('lodash');

Q.longStackSupport = true;

/**
 * Promisified fs methods
 * @constructor
 */
var Pfs = function () {
};

/**
 * Generate a sha512 hash of data.
 * @param {String} data   data to hash
 * @return {String} sha512 hex hash of data
 */
Pfs.prototype.hash = function (data) {
  var shasum = crypto.createHash('sha512');
  shasum.update(data);
  return shasum.digest('hex');
};

/**
 * Asynchronously Generate a sha512 hash of a file's contents
 * @param {String} file   file name to hash
 * @param {Function} callback
 */
Pfs.prototype.hashFile = function (f, cb) {
  var self = this;
  fs.readFile(f, function (err, data) {
    if (err) {
      throw err;
    }
    cb(self.hash(data));
  });
};

/**
 * Synchronously Generate a sha512 hash of a file's contents
 * @param {String} file   file name to hash
 * @return {String} sha512 hex hash of file
 */
Pfs.prototype.hashFileSync = function (f) {
  var self = this;
  return self.hash(fs.readFileSync(f));
};

/**
 * Asynchronously walk a folder tree, generating a sha512 hash of each file's contents.
 * hidden files (.*) are filtered out.
 * @param {String} folder   folder to hash
 * @param {RegExp} excludere regexp to exclude matches (optional)
 * @param {Function} callback callback(manifest), where manifest is {filename:{hash:sha512 hex hash of file, relname:string}
 */
Pfs.prototype.hashWalk = function (folder, excludere, cb) {
  var self = this,
    walker = walk.walk(folder),
    manifest = {},
    folder_re = new RegExp('^' + folder + '/');

  if (!cb) {
    if (typeof(excludere) === 'function') {
      cb = excludere;
      excludere = undefined;
    }
  }

  walker.on('file', function (root, fstats, next) {
    if (fstats.name.match(/^\.git/)) {
      next();
      return;
    }
    var f = path.join(root, fstats.name),
      relname = f.replace(folder_re, '');

    if (excludere && f.match(excludere)) {
      next();
      return;
    }

    self.hashFile(f, function (hash) {
      //manifest[f] = {
      manifest[f] = {
        hash: hash,
        root: root,
        file: fstats.name,
        relname: relname,
        fullname: f
      };
      next();
    });
  });

  walker.on('end', function () {
    cb(manifest);
  });
};

/**
 * mkdir -p ...
 * @param {String} folder path to recursively create
 * @param {Function} callback (err)
 */
Pfs.prototype.ensurePath = function (path, cb) {
  //console.log('calling mkdirp, path:', path, 'cb:', cb);
  mkdirp(path, cb);
};

/**
 * pExists - Promisified fs.exists()
 * @param {String} path
 * @returns {Promise} boolean exists?
 */
Pfs.prototype.pExists = function (path) {
  var deferred = Q.defer();
  fs.exists(path, function (exists) {
    deferred.resolve(exists);
  });
  return deferred.promise;
};

/**
 * Promisified wrapper for fs.lstat
 * Warning err may be ENOENT if file is missing, so callback method may be more appropriate in many circumstances.
 * @param   {string} file filename
 * @returns {object} Promise
 */
Pfs.prototype.pLstat = function (path) {
  return Q.nfcall(fs.lstat, path);
};

Pfs.prototype.pOpen = function (path, flags, mode) {
  return Q.nfcall(fs.open, path, flags, mode);
};

Pfs.prototype.pClose = function (fd) {
  return Q.nfcall(fs.close, fd);
};

Pfs.prototype.pMkdir = function (path, mode) {
  return Q.nfcall(fs.mkdir, path, mode);
};

Pfs.prototype.pRmdir = function (path) {
  return Q.nfcall(fs.rmdir, path);
};

Pfs.prototype.pUnlink = function (path) {
  return Q.nfcall(fs.unlink, path);
};

Pfs.prototype.pSymlink = function (target, path, type) {
  return Q.nfcall(fs.symlink, target, path, type);
};

Pfs.prototype.pChmod = function (path, mode) {
  return Q.nfcall(fs.chmod, path, mode);
};

Pfs.prototype.pChown = function (path, uid, gid) {
  return Q.nfcall(fs.chown, path, uid, gid);
};

module.exports = Pfs;
