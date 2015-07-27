/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  P2 = require('./p2');

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
  //console.log('apply called');
  _.each(self.args, function (a) {
    a = '../' + a;
    //console.log('a:', a);
    var p = require(a);
    //console.log('p:', p);
  });
};

module.exports = Policy;
