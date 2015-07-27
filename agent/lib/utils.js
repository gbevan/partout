/*jslint node: true, nomen: true, vars: true*/
'use strict';

var walk = require('walk'),
  path = require('path'),
  fs = require('fs'),
  crypto = require('crypto');

var Utils = function () {

};

// walk folder tree hashing files
Utils.prototype.hashWalk = function (folder, cb) {
  var walker = walk.walk(folder),
    manifest = {};

  walker.on('file', function (root, fstats, next) {
    var f = path.join(root, fstats.name);
    fs.readFile(f, function (err, data) {
      if (err) {
        throw err;
      }
      var shasum = crypto.createHash('sha512');
      shasum.update(data);
      var hash = shasum.digest('hex');
      manifest[f] = hash;
      next();
    });
  });

  walker.on('end', function () {
    cb(manifest);
  });
};

module.exports = Utils;
