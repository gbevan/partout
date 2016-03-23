/*jslint node: true */
'use strict';

var path = require('path'),
    os = require('os');

var Cfg = function () {
  var self = this;

  self.partout_master_hostname = 'officepc.net';
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
    self.PARTOUT_VARDIR = '/var/opt/partout';
  }
  self.PARTOUT_ETCDIR = path.join('.', 'etc');
  self.PARTOUT_MASTER_ETCDIR = 'etc';
  self.PARTOUT_MASTER_MANIFEST_DIR = path.join(self.PARTOUT_MASTER_ETCDIR, 'manifest');

  self.PARTOUT_AGENT_SSL_PUBLIC = path.join(self.PARTOUT_ETCDIR, 'ssl_public');

  self.PARTOUT_AGENT_SSL_DIR = path.join(self.PARTOUT_VARDIR, 'ssl');
  self.PARTOUT_AGENT_MANIFEST_DIR = path.join(self.PARTOUT_VARDIR, 'manifest');
  self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, 'site.p2');

  /*
   * defaults for agent to master event throttling
   */
  self.partout_agent_throttle = {
    aggregate_period_secs: 5, // 60,
    aggregate_period_splay: 0.05,
    aggregate_level: 4,
    notify_alive_period_secs: 60 * 60 * 24  // TODO: code agent alive msgs
  };

};

module.exports = Cfg;
