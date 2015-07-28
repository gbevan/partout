/*jslint node: true, nomen: true */
'use strict';

/*global GLOBAL */
var _ = require('lodash'),
  P2 = require('./p2'),
  path = require('path');

GLOBAL.p2 = new P2();
//console.log('GLOBAL:', GLOBAL);

function Policy(args) {
  var self = this;
  //console.log('Policy called with args:', args);
  self.args = args;
}

//Policy.prototype.... = function () {} ;

Policy.prototype.apply = function () {
  var self = this;
  _.each(self.args, function (a) {

    var abs_a = path.resolve(a);

    delete require.cache[abs_a];

    var p = require(abs_a);

    /*
    var i,
      keys = Object.keys(require.cache);
    for (i in keys) {
      var e = keys[i];
      if (typeof(e) === 'string') {
        if (e.match(/site\.p2/)) {
          console.log('req:', e);
        }
      }
    }
    console.log('p:', p);
    */
  });
};

module.exports = Policy;
