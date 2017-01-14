/*jslint node: true */

var randomart = require('randomart');

var KeyArt = function () {
};

KeyArt.prototype.toArt = function (data) {
  var lines = randomart(data).split(/\r?\n/);

  lines = lines.map(function (l) {
    return '|' + l + '|';
  });

  lines.unshift('+-----------------+')
  lines.push(   '+-----------------+')

  return lines.join('\n');
}

module.exports = KeyArt;
