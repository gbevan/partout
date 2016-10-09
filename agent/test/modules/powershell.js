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
    pfs = require('../../lib/pfs'),
    path = require('path'),
    utils = require('../../lib/utils'),
    os = require('os'),
    p2Test = require('../../lib/p2_test');

global.should = require('should');
should.extend();

Q.longStackSupport = true;

// Simulate commandline options --verbose, --debug and --timing
global.partout = {opts: {verbose: false, debug: false, timing: false}};

if (utils.isWin()) {
  describe('Module powershell', function () {

    it('Policy should spawn powershell without filter', function (done) {
      this.timeout(240000);

      utils.tlogs('tmpNameSync');
      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');
      utils.tloge('tmpNameSync');

      p2Test.runP2Str(
        'p2\n' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should spawn powershell with filter=true', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(true)' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should not spawn powershell with filter=false', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(false)' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should spawn powershell with filter=function returning true', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(function () { return true; })' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should not spawn powershell with filter=function returning false', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(function () { return false; })' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should spawn powershell with regex matching hostname', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(/' + os.hostname() + '/)' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    it('Policy should not spawn powershell with regex not matching hostname', function (done) {
      this.timeout(60000);

      var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

      p2Test.runP2Str(
        'p2\n' +
        '.node(/IUTGUIYFJGHVJHGG/)' +
        '.powershell(\'get-childitem -path env:computername > "{{{ testFile }}}"\');\n',
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
      .then(function () {
        done();
      })
      .done(null, function (err) {
        should(err).be.undefined;
        done(err);
      });

    });


    describe('cwd option', function () {

      it('Policy should run powershell in given directory', function (done) {
        this.timeout(60000);

        var testFile = tmp.tmpNameSync() + '.TEST',
            cwd = path.dirname(testFile);

        testFile = utils.escapeBackSlash(testFile);
        var cwd_p2 = utils.escapeBackSlash(cwd);

        var cmd = '(Get-Item -Path ".\" -Verbose).FullName';

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'{{{ cmd }}} | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {cwd:\'{{{ cwd }}}\'});\n',
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
          pwd.should.equal(cwd);

          return pfs.pUnlink(testFile);
        })
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });
      });

    }); // describe cwd

    describe('creates option', function () {
      var testFile = tmp.tmpNameSync() + '.TEST';
      testFile = utils.escapeBackSlash(testFile);

      it('Policy should run powershell if creates file does not exist', function (done) {
        this.timeout(60000);

        var cmd = 'echo CREATED';

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'{{{ cmd }}} | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {creates:\'{{{ testFile }}}\'});\n',
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

      it('Policy should not run powershell if creates file already exists', function (done) {
        this.timeout(60000);

        var cmd = 'echo CREATED_IN_ERROR';

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'{{{ cmd }}} | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {creates:\'{{{ testFile }}}\'});\n',
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
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });
      });

    }); // describe cwd


    describe('Callback function for action complete', function () {

      it('Should call the supplied callback function on success', function (done) {
        this.timeout(60000);
        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

        var cmd = 'p2\n' +
          '.powershell(\'Write-Output "OUT_STDOUT"; [Console]::Error.WriteLine("OUT_STDERR")\', function (rc, stdout, stderr) {\n' +
          //'  console.warn(\'IN CALLBACK err:\', err);\n' +
          '  var fs = require(\'fs\');\n' +
          '  var status = \'FAILED\';\n' +
          '  if (rc !== 0) status = rc;\n' +
          '  else if (stdout.trim() !== \'OUT_STDOUT\') status = \'STDOUT not passed\';\n' +
          '  else if (stderr.trim() !== \'OUT_STDERR\') status = \'STDERR not passed\';\n' +
          '  else status = \'SUCCESS\';\n' +
          '  fs.writeFileSync(\'{{{ testFile }}}\', status);\n' +
          //'  console.warn(\'at end\');\n' +
          '});\n';
        //console.log('cmd:', cmd);
        p2Test.runP2Str(
          cmd,
          {
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
          data.should.equal('SUCCESS');
          return pfs.pUnlink(testFile);
        })
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });

      });

      /* XXX: Come back to this
      it('Should call the supplied callback function on failure', function (done) {
        this.timeout(60000);
        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');
        var cmd = 'p2\n' +
          '.powershell(\'Write-Output "OUT_STDOUT"; [Console]::Error.WriteLine("OUT_STDERR"); exit 1\', function (rc, stdout, stderr) {\n' +
          //'  console.warn(\'IN CALLBACK err:\', err);\n' +
          '  var fs = require(\'fs\');\n' +
          '  var status = \'FAILED\';\n' +
          '  if (stdout.trim() !== \'OUT_STDOUT\') status = \'STDOUT not passed\';\n' +
          '  else if (stderr.trim() !== \'OUT_STDERR\') status = \'STDERR not passed\';\n' +
          '  else if (rc !== 0) status = \'SUCCESS\';\n' +
          '  fs.writeFileSync(\'{{{ testFile }}}\', status);\n' +
          //'  console.warn(\'at end\');\n' +
          '});\n';
        //console.log('cmd:', cmd);
        p2Test.runP2Str(
          cmd,
          {
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
          data.should.equal('SUCCESS');
          return pfs.pUnlink(testFile);
        })
        .then(function (err) {
          //console.log('then err:', err);
          should(err).be.undefined;
          done();
        })
        .done(null, function (err) {
          done(err);
        });

      });
      */

    }); // describe callback function


    describe('onlyif as a string', function () {

      it('Policy should execute powershell if onlyif returns rc=0', function (done) {
        this.timeout(240000);

        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'echo SUCCESS | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {onlyif: \'exit 0\'});\n',
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
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });

      });

      it('Policy should not execute powershell if onlyif returns rc!=0', function (done) {
        this.timeout(240000);

        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'echo SUCCESS | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {onlyif: \'exit 1\'});\n',
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
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });

      });

    }); // onlyif as a string

    describe('onlyif as a file reference', function () {

      it('Policy should execute powershell if onlyif returns rc=0', function (done) {
        this.timeout(240000);

        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'echo SUCCESS | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {onlyif: {file: \'test/modules/files/cmd_test_rc_0.sh\'}});\n',
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
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });

      });

      it('Policy should not execute powershell if onlyif returns rc!=0', function (done) {
        this.timeout(240000);

        var testFile = utils.escapeBackSlash(tmp.tmpNameSync() + '.TEST');

        p2Test.runP2Str(
          'p2\n' +
          '.powershell(\'echo SUCCESS | Out-File -Encoding utf8 -FilePath "{{{ testFile }}}"\', {onlyif: {file: \'test/modules/files/cmd_test_rc_1.sh\'}});\n',
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
        .then(function () {
          done();
        })
        .done(null, function (err) {
          should(err).be.undefined;
          done(err);
        });

      });

    }); // onlyif as a file reference


  });
} // isWin?
