/*jslint node: true */
'use strict';

var Cfg = function () {
  var self = this;

  //self.partout_master_hostname = 'officepc.net';
  self.partout_master_hostname = '172.17.0.1';
  self.partout_master_port = 10443;

  self.partout_agent_port = 10444;

  self.PARTOUT_AGENT_SSL_PUBLIC = './etc/ssl_public';

  /*
   * moved to Ssl
  self.partout_agent_publicKeyFile = './etc/ssl/agent_public.key';
  self.partout_agent_privateKeyFile = './etc/ssl/agent_private.key';
  self.partout_agent_certFile = './etc/ssl/agent_signed.crt';
  self.partout_agent_csrFile = './etc/ssl/agent_unsigned.csr';
  */
};

module.exports = Cfg;
