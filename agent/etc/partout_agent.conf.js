/*jslint node: true */
'use strict';

var path = require('path');

var Cfg = function () {
  var self = this;

  self.partout_master_hostname = 'officepc.net';
  self.partout_master_port = 10443;

  self.partout_agent_port = 10444;

  self.PARTOUT_VARDIR = '/var/opt/partout';
  self.PARTOUT_ETCDIR = './etc';
  self.PARTOUT_MASTER_ETCDIR = 'etc';
  self.PARTOUT_MASTER_MANIFEST_DIR = path.join(self.PARTOUT_MASTER_ETCDIR, 'manifest');

  self.PARTOUT_AGENT_SSL_PUBLIC = path.join(self.PARTOUT_ETCDIR, 'ssl_public');

  self.PARTOUT_AGENT_SSL_DIR = path.join(self.PARTOUT_VARDIR, 'ssl');
  self.PARTOUT_AGENT_MANIFEST_DIR = path.join(self.PARTOUT_VARDIR, 'manifest');
  self.PARTOUT_AGENT_MANIFEST_SITE_P2 = path.join(self.PARTOUT_AGENT_MANIFEST_DIR, 'site.p2');

  /*
   * moved to Ssl
  self.partout_agent_publicKeyFile = './etc/ssl/agent_public.key';
  self.partout_agent_privateKeyFile = './etc/ssl/agent_private.key';
  self.partout_agent_certFile = './etc/ssl/agent_signed.crt';
  self.partout_agent_csrFile = './etc/ssl/agent_unsigned.csr';
  */
};

module.exports = Cfg;
