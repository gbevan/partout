/*jslint node: true */
'use strict';

var randomart = require('randomart');

var KeyArt = function () {
};

KeyArt.prototype.toArt = function (data) {
//  var buf = Buffer.from(data); // v6
  var buf = new Buffer(data); // v4
  buf = Array.prototype.slice.call(buf, 0);

  var lines = randomart(buf).split(/\r?\n/);

  lines = lines.map(function (l) {
    return '|' + l + '|';
  });

  lines.unshift('+-----------------+');
  lines.push(   '+-----------------+');

  return lines.join('\n');
};

module.exports = KeyArt;
