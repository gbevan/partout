/*jslint node: true */
'use strict';

var os = require('os');

var Cfg = function () {
  var self = this;

  //self.partout_master_hostname = '172.17.42.1';
  self.partout_master_hostname = os.hostname;

  self.partout_ui_port = 11443;
  self.partout_api_port = 10443;

  //console.log('env:', process.env.NODE_ENV);

  self.database_name = 'partout';

};

module.exports = Cfg;
