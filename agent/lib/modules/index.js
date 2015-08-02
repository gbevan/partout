/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  modules = _.remove(
    fs.readdirSync(path.dirname(module.filename)), // TODO: walk?
    function (m) {
      return m.match(/\.js$/) !== null && m !== 'index.js';
    }
  );

module.exports = function (facts) {
  // dynamically load modules
  var _exports = {};
  _.every(modules, function (m) {
    m = './' + m;
    var M = require(m),
      mFacts = {};

    if (M.getFacts) {
      mFacts = M.getFacts();
    }
    //console.log('mFacts:', mFacts);

    if (facts) {
      //console.log(_o.name, 'facts:', _o.facts);
      if (mFacts) {
        _.merge(facts, mFacts);
      }
    }
    //console.log('M.getName:', M.getName());
    _exports[M.getName()] = M;

    return true;
  });

  return _exports;
};
