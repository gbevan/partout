/*jslint node: true, nomen: true, vars: true*/
'use strict';

var walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto');

/**
 * Common utils
 * @constructor
 */
var Utils = function () {
};

/**
 * Generate a sha512 has of data.
 * @param {String} data
 * @return {String} sha512 hex hash of data
 */
Utils.prototype.hash = function (data) {
  var shasum = crypto.createHash('sha512');
  shasum.update(data);
  return shasum.digest('hex');
};

/**
 * Asynchronously Generate a sha512 has of a file's contents
 * @param {String} file name to hash
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
 * Synchronously Generate a sha512 has of a file's contents
 * @param {String} file name to hash
 * @return {String} sha512 hex hash of file
 */
Utils.prototype.hashFileSync = function (f) {
  var self = this;
  return self.hash(fs.readFileSync(f));
};

/**
 * Asynchronously walk a folder tree, generating a sha512 has of each file's contents
 * @param {String} folder to hash
 * @param {Function} callback(manifest), where manifest is filename=sha512 hex hash of file
 */
// walk folder tree hashing files
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

module.exports = Utils;
