/*jslint node: true */
'use strict';

var randomart = require('randomart');

var KeyArt = function () {
};

KeyArt.prototype.toArt = function (data) {
  var buf = Buffer.from(data);
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
