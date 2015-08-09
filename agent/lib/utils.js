/*jslint node: true, nomen: true, vars: true*/
'use strict';

var walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto');

var Utils = function () {
};

Utils.prototype.hash = function (data) {
  var shasum = crypto.createHash('sha512');
  shasum.update(data);
  return shasum.digest('hex');
};

Utils.prototype.hashFile = function (f, cb) {
  var self = this;
  fs.readFile(f, function (err, data) {
    if (err) {
      throw err;
    }
    cb(self.hash(data));
  });
};

Utils.prototype.hashFileSync = function (f, cb) {
  var self = this;
  return self.hash(fs.readFileSync(f));
};

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
