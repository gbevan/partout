/*jslint node: true */
'use strict';

var Cfg = function () {
  var self = this;

  self.partout_master_hostname = 'officepc.net';
  self.partout_master_port = 10443;

  self.partout_agent_port = 10444;

  self.partout_agent_publicKeyFile = './etc/ssl/agent_public.key';
  self.partout_agent_privateKeyFile = './etc/ssl/agent_private.key';
  self.partout_agent_certFile = './etc/ssl/agent_signed.crt';
  self.partout_agent_csrFile = './etc/ssl/agent_unsigned.csr';

};

module.exports = Cfg;
