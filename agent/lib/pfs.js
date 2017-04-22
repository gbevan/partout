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
    os = require('os'),
    crypto = require('crypto'),
    mkdirp = require('mkdirp'),
    Q = require('q'),
    _ = require('lodash'),
    utils = require('./utils'),
    u = require('util');


Q.longStackSupport = true;

/**
 * Promisified fs methods
 * @constructor
 */
var Pfs = function () {

  if (!(this instanceof Pfs)) {
    return new Pfs();
  }

};

/**
 * Rename a file.
 * @param oldPath
 * @param newPath
 * @return {Promise}
 */
Pfs.prototype.pRename = Q.denodeify(fs.rename);

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
 * @param {String}   file      file name to hash
 * @param {boolean}  cbWithErr (optional) if true callback is called with (err, value), otherwise just (value) and errors are thrown
 * @param {Function} callback
 */
Pfs.prototype.hashFile = function (f, cbWithErr, cb) {
  var self = this,
      shasum = crypto.createHash('sha512'),
      rs = fs.createReadStream(f);

  if (typeof cbWithErr === 'function') {
    cb = cbWithErr;
    cbWithErr = false;
  }

  rs.on('readable', function () {
    var data = rs.read();
    if (data) {
      shasum.update(data);
    } else {
      if (cbWithErr) {
        cb(null, shasum.digest('hex'));
      } else {
        cb(shasum.digest('hex'));
      }
    }
  });

  rs.on('error', function (err) {
    if (cbWithErr) {
       cb(err);
    } else {
      throw err;
    }
  });
};

/**
 * Promisified hashfile()
 * @param   {string}  f file path
 * @returns {promise}
 */
Pfs.prototype.pHashFile = function (f) {
  return Q.nfcall(this.hashFile, f, true);
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
 * Asynchronously walk a folder tree
 * .git files are filtered out.
 * @param {String} folder   folder to hash
 * @param {RegExp} excludere regexp to exclude matches (optional)
 * @returns promise (manifest), where manifest is {filename:{relname:string}
 */
Pfs.prototype.walk = function (folder, excludere, cb) {
  var self = this,
      walker = walk.walk(folder),
      manifest = {},
      folder_re = new RegExp('^' + folder + '/'),
      deferred = Q.defer();

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

    manifest[f] = {
      root: root,
      file: fstats.name,
      relname: relname,
      fullname: f
    };

    next();
  });

  walker.on('end', function () {
    deferred.resolve(manifest);
  });

  return deferred.promise;
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

  /*
   *fs.exists is now deprecated
  fs.exists(path, function (exists) {
    deferred.resolve(exists);
  });
   */

  fs.stat(path, function (err, stat) {
    if (err) {
      if (err.code === 'ENOENT') {
        deferred.resolve(false);
        return;
      }
      throw err;
    }

    deferred.resolve(true);
  });

  return deferred.promise;
};

/**
 * Promisified fs.stat()
 * @param   {string}  path file path
 * @returns {promise} resolves to stat or undefined if not found, errors reject.
 */
Pfs.prototype.pStat = function (path) {
  var deferred = Q.defer();

  fs.stat(path, function (err, stat) {
    if (err) {
      if (err.code === 'ENOENT') {
        deferred.resolve();
      } else {
        deferred.reject(err);
      }
    }
    deferred.resolve(stat);
  });

  return deferred.promise;
};

/**
 * Promisified wrapper for fs.lstat
 * Warning err may be ENOENT if file is missing, so callback method may be more appropriate in many circumstances.
 * @param   {string} file filename
 * @returns {object} Promise resolves to
Pfs.prototype.pLstat = function (path) {
  return Q.nfcall(fs.lstat, path);
};
 */

Pfs.prototype.pOpen = function (path, flags, mode) {
  return Q.nfcall(fs.open, path, flags, mode);
};

Pfs.prototype.pClose = function (fd) {
  return Q.nfcall(fs.close, fd);
};

Pfs.prototype.pTouch = function (file) {
  var self = this;

  return self.pOpen(file, 'w')
  .then(function (fd) {
    return self.pClose(fd)
    .then(function () {
      return Q.resolve();
    });
  });

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
  if (typeof(uid) === 'string') {
    uid = parseInt(uid);
  }
  if (typeof(gid) === 'string') {
    gid = parseInt(gid);
  }
  return Q.nfcall(fs.chown, path, uid, gid);
};

Pfs.prototype.pReadDir = function (path) {
  return Q.nfcall(fs.readdir, path);
};

Pfs.prototype.pReadFile = function (file, options) {
  return Q.nfcall(fs.readFile, file, options);
};

Pfs.prototype.pWriteFile = function (file, data, options) {
  return Q.nfcall(fs.writeFile, file, data, options);
};

/**
 * Get Uid/Sid for a given user name.  If name is a number, resolve to that directly.
 * Also supports local accounts on Windows
 * @param   {string_or_number} name User name / Account to lookup Uid/Sid
 * @returns {Promise}          Promise (uid/sid)
 */
Pfs.prototype.pGetUid = function (name) {
  var deferred = Q.defer();

  if (u.isNumber(name)) { // TODO: if SID?
    deferred.resolve(name);

  } else {

    var cmd = 'id -u ' + name;
    if (os.type === 'Windows_NT') {
      cmd = u.format('wmic useraccount where name=\'%s\' get sid', name);
    }
    utils.pExec(cmd)
    .done(function (stdout, stderr) {
      utils.dlog('cmd:', cmd, 'stdout:', stdout, 'stderr:', stderr);

      deferred.resolve(stdout[0].toString().trim().replace(/\n|\r/g, ''));
    });

  }

  return deferred.promise;
};

/**
 * Get Gid/Sid for a given group name.  If name is a number, resolve to that directly.
 * Also supports local groups on Windows
 * @param   {string_or_number} name User name / Account to lookup Gid/Sid
 * @returns {Promise}          Promise (gid/sid)
 */
Pfs.prototype.pGetGid = function (name) {
  var deferred = Q.defer();

  if (u.isNumber(name)) { // TODO: if SID?
    deferred.resolve(name);

  } else {

    var cmd = u.format('getent group %s | awk -F: \'{ print $3; }\'', name);
    if (os.type === 'Windows_NT') {
      cmd = u.format('wmic group where name=\'%s\' get sid', name);
    }
    utils.pExec(cmd)
    .done(function (stdout, stderr) {
      utils.dlog('cmd:', cmd, 'stdout:', stdout, 'stderr:', stderr);

      deferred.resolve(stdout[0].toString().trim().replace(/\n|\r/g, ''));
    });

  }

  return deferred.promise;
};

/**
 * Resolve path to node executing this instance of the partout agent
 * @returns {string} node dirname
 */
Pfs.prototype.resolveNodeDir = function () {
  return path.dirname(process.argv[0]);
};

/**
 * Stream copy src file to tgt, returns a promise
 * @param   {string}   src source file path
 * @param   {string}   tgt target file path
 * @returns {promise}
 */
Pfs.prototype.pCopy = function (src, tgt) {
  var src_deferred = Q.defer();

  // Copy src to target
  var rs = fs.createReadStream(src);
  var ws = fs.createWriteStream(tgt);
  rs.pipe(ws);

  rs.on('end', function () {
    src_deferred.resolve();
  });

  rs.on('error', function (err) {
    src_deferred.reject(err);
  });

  return src_deferred.promise;
};

/**
 * Make an original copy of a file before modifying it
 * @param   {string}  file file to be saved for orig
 * @returns {promise}
 */
Pfs.prototype.makeOrig = function (file, keep_orig) {
  var self = this,
      orig = file + '.orig_partout';

  if (keep_orig === undefined) {
    keep_orig = true;
  }

  if (!keep_orig) {
    return Q();
  }

  return self.pStat(file)
  .then(function (file_stats) {
    if (!file_stats) {
      return false;
    }
    if (file_stats.size === 0) {
      return false;
    }
    return true;
  })
  .then(function (toCopy) {
    if (!toCopy) {
      return Q('skip');
    }
    return self.pExists(orig);
  })
  .then(function(exists) {

    if (!exists) {  // 'skip' or false
      return self.pCopy(file, orig);
    } else {
      return Q();
    }

  });
};

module.exports = new Pfs();
