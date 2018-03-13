/*jslint node: true */
'use strict';

var path = require('path'),
    os = require('os'),
    fs = require('fs'),
    Q = require('q'),
    u = require('util');

Q.longStackSupport = true;

var Cfg = function () {
  var self = this;

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
    if (process.env.NODE_ENV === 'test') {
      self.PARTOUT_VARDIR = '/tmp/var/opt/partout';
    } else {
      self.PARTOUT_VARDIR = '/var/opt/partout';
    }
  }

  self.PARTOUT_AGENT_ENVIRONMENT_FILE = path.join(self.PARTOUT_VARDIR, 'environment');

  self.PARTOUT_ETCDIR = path.join(__dirname, '..', 'etc');
  self.PARTOUT_MASTER_ETCDIR = 'etc';
  self.PARTOUT_MASTER_MANIFEST_DIR = path.join(self.PARTOUT_MASTER_ETCDIR, 'manifest');

  self.PARTOUT_AGENT_SSL_PUBLIC = path.join(self.PARTOUT_ETCDIR, 'ssl_public');

  self.PARTOUT_AGENT_SSL_DIR = path.join(self.PARTOUT_VARDIR, 'ssl');
  self.PARTOUT_AGENT_MANIFEST_DIR = path.join(self.PARTOUT_VARDIR, 'manifest');
  //self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, 'site.p2');

  // allow call from agent app.js to set paths for environment
  self.setEnvironment = function (optenv) {

    // Save environment if specified as option (--env)
    var stat,
        env;

    try {
      stat = fs.statSync(self.PARTOUT_AGENT_ENVIRONMENT_FILE);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    var oldenv;
    if (stat) {
      oldenv = fs.readFileSync(self.PARTOUT_AGENT_ENVIRONMENT_FILE).toString().trim();
    }

//    if (optenv && process.env.NODE_ENV === 'production') {
    if (optenv) {

      if (!stat || oldenv !== optenv) {
        try {
          env = optenv;
          fs.writeFileSync(self.PARTOUT_AGENT_ENVIRONMENT_FILE, env + '\n');
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw e;
          }
        }
      }

    }

    if (!env) {
      env = oldenv;
    }

    if (env) {
      self.environment = env;
      self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, env, 'site.p2');
    } else {
      self.environment = undefined;
      self.PARTOUT_AGENT_MANIFEST_SITE_P2 = undefined;
    }

    return env;
  };
  self.setEnvironment();  // read cached env

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
