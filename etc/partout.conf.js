/*jslint node: true */
'use strict';

var os = require('os');

var Cfg = function () {
  var self = this,
      isInTest = typeof GLOBAL.it === 'function';  // in Mocha test?

  //self.partout_master_hostname = '172.17.42.1';
  //self.partout_master_hostname = os.hostname;
  self.partout_master_hostname = '192.168.0.64';

  self.partout_ui_port = 11443;
  self.partout_api_port = 10443;

  //console.log('env:', process.env.NODE_ENV);

  if (isInTest) {
    self.database_name = 'partout-test';
  } else {
    self.database_name = 'partout';
  }

  // Settings
  self.event_rate_divisor = 100;
  self.aggregate_collection_period_secs_max = 60 * 60;   // 1 hour
  self.aggregate_collection_period_secs_min = 5;

  // After Pmax (above) is reached, we start to reduce the amount of detail in the aggregate events

  // Events per minute thresholds for aggregate detail level reduction
  self.em_threshold_obj = 500;
  self.em_threshold_mod = 2000;
  self.em_threshold_uuid = 5000;

};

module.exports = Cfg;
