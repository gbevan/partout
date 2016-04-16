/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
    os = require('os'),
    p2Test = require('../../lib/p2_test');

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
GLOBAL.partout = {opts: {verbose: false, debug: false, timing: false}};


describe('Module exec', function () {

  it('Policy should execute command without filter', function (done) {
    this.timeout(240000);

    utils.tlogs('tmpNameSync');
    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');
    utils.tloge('tmpNameSync');

    p2Test.runP2Str(
      'p2\n' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.true;
      return pfs.pUnlink(testFile);
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should execute command with filter=true', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(true)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.true;
      return pfs.pUnlink(testFile);
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should not execute command with filter=false', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(false)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.false;
      if (exists) {
        return pfs.pUnlink(testFile);
      } else {
        return Q();
      }
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should execute command with filter=function returning true', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(function () { return true; })' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.true;
      return pfs.pUnlink(testFile);
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should not execute command with filter=function returning false', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(function () { return false; })' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.false;
      if (exists) {
        return pfs.pUnlink(testFile);
      } else {
        return Q();
      }
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should execute command with regex matching hostname', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(/' + os.hostname() + '/)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.true;
      return pfs.pUnlink(testFile);
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
    });

  });


  it('Policy should not execute command with regex not matching hostname', function (done) {
    this.timeout(60000);

    var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

    p2Test.runP2Str(
      'p2\n' +
      '.node(/IUTGUIYFJGHVJHGG/)' +
      '.exec(\'echo SUCCESS > "{{{ testFile }}}"\');\n',
      {
        testFile: testFile
      }
    )
    .then(function () {
      return pfs.pExists(testFile);
    })
    .then(function (exists) {
      exists.should.be.false;
      if (exists) {
        return pfs.pUnlink(testFile);
      } else {
        return Q();
      }
    })
    .then(function (err) {
      should(err).be.undefined;
      done();
    })
    .done(null, function (err) {
      done(err);
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

      p2Test.runP2Str(
        'p2\n' +
        '.exec(\'{{{ cmd }}} > "{{{ testFile }}}"\', {cwd:\'{{{ cwd }}}\'});\n',
        {
          cmd: cmd,
          testFile: testFile,
          cwd: cwd_p2
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
        return pfs.pReadFile(testFile);
      })
      .then(function (pwd) {
        pwd = pwd.toString().trim();
        //console.warn('pwd:', pwd);
        pwd.should.equal(cwd);

        return pfs.pUnlink(testFile);
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })
      .done(null, function (err) {
        done(err);
      });
    });

  }); // describe cwd

  describe('creates option', function () {
    var testFile = tmp.tmpNameSync() + '.TEST';
    testFile = utils.escapeBackSlash(testFile);

    it('Policy should run command if creates file does not exist', function (done) {
      this.timeout(60000);

      var cmd = 'echo CREATED';

      p2Test.runP2Str(
        'p2\n' +
        '.exec(\'{{{ cmd }}} > "{{{ testFile }}}"\', {creates:\'{{{ testFile }}}\'});\n',
        {
          cmd: cmd,
          testFile: testFile
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
          // Leave testFile in place for next test based on its existance
        done();
      })
      .done(null, function (err) {
        done(err);
      });

    });

    it('Policy should not run command if creates file already exists', function (done) {
      this.timeout(60000);

      var cmd = 'echo CREATED_IN_ERROR';

      p2Test.runP2Str(
        'p2\n' +
        '.exec(\'{{{ cmd }}} > "{{{ testFile }}}"\', {creates:\'{{{ testFile }}}\'});\n',
        {
          cmd: cmd,
          testFile: testFile
        }
      )
      .then(function () {
        return pfs.pExists(testFile);
      })
      .then(function (exists) {
        exists.should.be.true;
        return pfs.pReadFile(testFile);
      })
      .then(function (data) {
        data = data.toString().trim();
        data.should.equal('CREATED'); // contents persist from previous test
        return pfs.pUnlink(testFile);
      })
      .then(function (err) {
        should(err).be.undefined;
        done();
      })
      .done(null, function (err) {
        done(err);
      });
    });

  }); // describe cwd

});
