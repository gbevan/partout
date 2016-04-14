/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, it, should*/
var Q = require('q'),
    tmp = require('tmp'),
    fs = require('fs'),
    Policy = require('../../lib/policy'),
    u = require('util'),
    pfs = new (require('../../lib/pfs'))(),
    path = require('path'),
    utils = new (require('../../lib/utils'))();

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

GLOBAL.partout = {opts: {debug: false}};

describe('Module exec', function () {

  it('Policy should execute command without filter', function (done) {
    this.timeout(60000);
    tmp.file({keep: true}, function (err, tpath, fd, cleanupcb) {
      if (err) {
        throw err;
      }
      console.log('tpath:', tpath, 'fd:', fd);
      var testFile = utils.escapeBackSlash(tpath + '.TEST');

      console.log('testFile:', testFile);

      // create a temporary policy to test
      var p2 = u.format(
        'p2\n' +
        '.exec(\'echo SUCCESS > "%s"\');\n',
        //'.end();\n',
        testFile
      );

      console.log('exec p2:\n', p2);
      fs.write(fd, p2, 0, 'utf8', function (err) {
        //console.log('written');
        new Policy([tpath], {apply: true})
        .done(function (policy) {
          //console.log('policy:', policy);
          policy.apply()
          .done(function () {
            console.log('TEST policy.apply() resolved');
            //deferred.resolve();

            console.log('checking for file:', testFile);
            pfs.pExists(testFile)
            .done(function (exists) {
              console.log('exists:', exists);
              exists.should.be.true;
              //pfs.pUnlink(testFile)
              //.done(function (err) {
                //should(err).be.undefined;
                done();
              //});
            });

          });
        });
      });
    });
  });

});
