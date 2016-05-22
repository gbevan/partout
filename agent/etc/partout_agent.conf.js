/*jslint node: true */
'use strict';

var path = require('path'),
    os = require('os'),
    pfs = new (require('../lib/pfs'))(),
    Q = require('q');

var Cfg = function () {
  var self = this,
      isInTest = typeof GLOBAL.it === 'function';  // in Mocha test?

//  console.log('isInTest:', isInTest);
//  console.log('GLOBAL.it:', GLOBAL.it);

  //self.partout_master_hostname = 'officepc.net';
  self.partout_master_hostname = '192.168.0.64';
  self.partout_master_port = 10443;

  self.partout_agent_port = 10444;

  if (os.type() === 'Windows_NT') {
    if (os.release().match(/^(6|7|8|10)\./)) {
      self.PARTOUT_VARDIR = path.join(
        'C:',
        'ProgramData',
        'Partout',
        'Partout-Agent'
      );
    } else {
      throw new Error('Unsupported version of Windows');
    }
  } else {
    if (isInTest) {
      self.PARTOUT_VARDIR = '/tmp/var/opt/partout';
    } else {
      self.PARTOUT_VARDIR = '/var/opt/partout';
    }
  }

  self.PARTOUT_AGENT_ENVIRONMENT_FILE = path.join(self.PARTOUT_VARDIR, 'environment');

  self.PARTOUT_ETCDIR = path.join('.', 'etc');
  self.PARTOUT_MASTER_ETCDIR = 'etc';
  self.PARTOUT_MASTER_MANIFEST_DIR = path.join(self.PARTOUT_MASTER_ETCDIR, 'manifest');

  self.PARTOUT_AGENT_SSL_PUBLIC = path.join(self.PARTOUT_ETCDIR, 'ssl_public');

  self.PARTOUT_AGENT_SSL_DIR = path.join(self.PARTOUT_VARDIR, 'ssl');
  self.PARTOUT_AGENT_MANIFEST_DIR = path.join(self.PARTOUT_VARDIR, 'manifest');
  //self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, 'site.p2');

  // allow call from agent app.js to set paths for environment
  self.setEnvironment = function (optenv) {

    // Save environment if specified as option (--env)
    var deferred = Q.defer(),
        env_deferred = Q.defer();

    pfs.pExists(self.PARTOUT_AGENT_ENVIRONMENT_FILE)
    .done(function (exists) {
      if (!exists || optenv) {
        // create/write it
        var env = (optenv ? optenv : 'default');
        pfs.pWriteFile(self.PARTOUT_AGENT_ENVIRONMENT_FILE, env)
        .done(function () {
          env_deferred.resolve(env);
        });
      } else {
        // read it
        pfs.pReadFile(self.PARTOUT_AGENT_ENVIRONMENT_FILE)
        .done(function (env) {
          env_deferred.resolve(env.toString().trim());
        });
      }
    });

    env_deferred
    .promise
    .done(function (env) {
      self.environment = env;
      self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, env, 'site.p2');
      deferred.resolve(env);
    });

    return deferred.promise;
  };
  self.setEnvironment();  // assumes default until the environment file is created

  /*
   * defaults for agent to master event throttling
   */
  self.partout_agent_throttle = {

    // Defaults (modified by algorythms)
    aggregate_period_secs: 5, // 60,
    aggregate_period_splay: 0.05,
    aggregate_level: 4,
    notify_alive_period_secs: 60 * 60 * 24  // TODO: code agent alive msgs
  };

  /*
   * Enable the /mocha REST API for real-time unit-testing during development
   * !!!THIS MUST BE DISABLED FOR PRODUCTION!!!
   */
  self.partout_agent_permit_mocha_api = true;

};

module.exports = Cfg;
