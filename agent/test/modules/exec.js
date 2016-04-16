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
    utils = new (require('../../lib/utils'))(),
    Mustache = require('mustache'),
    os = require('os');

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

GLOBAL.partout = {opts: {debug: false, timing: false}};

/**
 * Run a p2 policy from a string
 * @param {string} p2 Policy expression in p2
 */
function runP2Str(p2Str, vars) {
  var deferred = Q.defer(),
      p2 = Mustache.render(p2Str, vars, {});

  utils.tlogs('tmp.file');
  tmp.file({keep: false}, function (err, tpath, fd, cleanupcb) {
    utils.tloge('tmp.file');
    if (err) {
      throw err;
    }
    fs.write(fd, p2, 0, 'utf8', function (err) {
      utils.tlogs('new Policy');
      new Policy([tpath], {apply: true})
      .done(function (policy) {
        utils.tloge('new Policy');
        utils.tlogs('policy apply');
        policy.apply()
        .done(function () {
          utils.tloge('policy apply');
          deferred.resolve();
        });
      });
    });
  });

  return deferred.promise;
}

describe('Module exec', function () {

  it('Policy should execute command without filter', function (done) {
    this.timeout(240000);

    utils.tlogs('tmpNameSync');
    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');
    utils.tloge('tmpNameSync');

    runP2Str(
      'p2\n' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.true;
        pfs.pUnlink(testFile)
        .done(function (err) {
          should(err).be.undefined;
          done();
        });
      });

    });
  });


  it('Policy should execute command with filter=true', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(true)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.true;
        pfs.pUnlink(testFile)
        .done(function (err) {
          should(err).be.undefined;
          done();
        });
      });

    });
  });


  it('Policy should not execute command with filter=false', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(false)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.false;
        if (exists) {
          pfs.pUnlink(testFile)
          .done(function (err) {
            should(err).be.undefined;
            done();
          });
        } else {
          done();
        }
      });

    });
  });


  it('Policy should execute command with filter=function returning true', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(function () { return true; })' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.true;
        pfs.pUnlink(testFile)
        .done(function (err) {
          should(err).be.undefined;
          done();
        });
      });

    });
  });


  it('Policy should not execute command with filter=function returning false', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(function () { return false; })' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.false;
        if (exists) {
          pfs.pUnlink(testFile)
          .done(function (err) {
            should(err).be.undefined;
            done();
          });
        } else {
          done();
        }
      });

    });
  });


  it('Policy should execute command with regex matching hostname', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(/' + os.hostname() + '/)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.true;
        pfs.pUnlink(testFile)
        .done(function (err) {
          should(err).be.undefined;
          done();
        });
      });

    });
  });


  it('Policy should not execute command with regex not matching hostname', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    runP2Str(
      'p2\n' +
      '.node(/IUTGUIYFJGHVJHGG/)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .done(function () {

      pfs.pExists(testFile)
      .done(function (exists) {
        exists.should.be.false;
        if (exists) {
          pfs.pUnlink(testFile)
          .done(function (err) {
            should(err).be.undefined;
            done();
          });
        } else {
          done();
        }
      });

    });
  });


  describe('cwd option', function () {

    it('Policy should run command in given directory', function (done) {
      this.timeout(60000);

      var testFile = tmp.tmpNameSync() + '.TEST',
          cwd = path.dirname(testFile);

      testFile = utils.escapeBackSlash(testFile);
      var cwd_p2 = utils.escapeBackSlash(cwd);

      var cmd = (os.platform() === 'win32' ? 'cd' : 'pwd');

      runP2Str(
        'p2\n' +
        '.exec(\'{{{ cmd }}} > "{{{ testFile }}}"\', {cwd:\'{{{ cwd }}}\'});\n',
        {
          cmd: cmd,
          testFile: testFile,
          cwd: cwd_p2
        }
      )
      .done(function () {

        pfs.pExists(testFile)
        .done(function (exists) {
          exists.should.be.true;
          if (exists) {

            pfs.pReadFile(testFile)
            .done(function (pwd) {
              pwd = pwd.toString().trim();
              console.warn('pwd:', pwd);
              pwd.should.equal(cwd);

              pfs.pUnlink(testFile)
              .done(function (err) {
                should(err).be.undefined;
                done();
              });
            });
          } else {
            done();
          }
        });

      });
    });

  }); // describe cwd

});
