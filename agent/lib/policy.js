/*jslint node: true, nomen: true, regexp: true, vars: true*/
'use strict';

/*global GLOBAL, p2 */
var console = require('better-console'),
  _ = require('lodash'),
  P2 = require('./p2'),
  path = require('path');

GLOBAL.p2 = new P2();
GLOBAL.P2 = P2;
//console.log('GLOBAL:', GLOBAL);

function Policy(args, opts) {
  var self = this;
  //console.log('Policy called with args:', args, 'opts:', opts);
  self.args = args;
  GLOBAL.p2_agent_opts = self.opts = opts;

  if (self.opts.showfacts) {
    p2.print_facts();
  }
}

//Policy.prototype.... = function () {} ;

Policy.prototype.apply = function () {
  var self = this;
  _.each(self.args, function (a) {

    var abs_a = path.resolve(a);

    delete require.cache[abs_a];
    p2.P2_watchers_close();
    GLOBAL.p2 = new P2();
    GLOBAL.P2 = P2;

    // try approach deprecated by p2Dummy
    //try {
    var p = require(abs_a);
    /*
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      var te = e.toString();
      // TODO: check against list of registered methods imported
      if (!te.match(/^TypeError: Cannot call method .* of null/)) {
        throw e;
      }
    }
    */
    console.log('### END OF APPLY ################################');
  });
};

module.exports = Policy;
