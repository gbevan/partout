/*jslint node: true, nomen: true, vars: true*/
'use strict';

var walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp'),
  Q = require('q');

/**
 * Common utils
 * @constructor
 */
var Utils = function () {
};

/**
 * Generate a sha512 hash of data.
 * @param {String} data   data to hash
 * @return {String} sha512 hex hash of data
 */
Utils.prototype.hash = function (data) {
  var shasum = crypto.createHash('sha512');
  shasum.update(data);
  return shasum.digest('hex');
};

/**
 * Asynchronously Generate a sha512 hash of a file's contents
 * @param {String} file   file name to hash
 * @param {Function} callback
 */
Utils.prototype.hashFile = function (f, cb) {
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
Utils.prototype.hashFileSync = function (f) {
  var self = this;
  return self.hash(fs.readFileSync(f));
};

/**
 * Asynchronously walk a folder tree, generating a sha512 hash of each file's contents
 * @param {String} folder   folder to hash
 * @param {Function} callback callback(manifest), where manifest is {filename:sha512 hex hash of file}
 */
Utils.prototype.hashWalk = function (folder, cb) {
  var self = this,
    walker = walk.walk(folder),
    manifest = {};

  walker.on('file', function (root, fstats, next) {
    var f = path.join(root, fstats.name);
    self.hashFile(f, function (hash) {
      manifest[f] = hash;
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
Utils.prototype.ensurePath = function (path, cb) {
  //console.log('calling mkdirp, path:', path, 'cb:', cb);
  mkdirp(path, cb);
};

/**
 * pExists - Promisified fs.exists()
 * @param {String} file
 * @returns {Promise} boolean exists?
 */
Utils.prototype.pExists = function (file) {
  var deferred = Q.defer();
  fs.exists(file, function (exists) {
    deferred.resolve(exists);
  });
  return deferred.promise;
};

module.exports = Utils;
