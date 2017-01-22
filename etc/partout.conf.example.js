/*jslint node: true */
'use strict';

var os = require('os');

var Cfg = function () {
  var self = this;

  //self.partout_master_hostname = '172.17.42.1';
  //self.partout_master_hostname = os.hostname;
  self.partout_master_hostname = 'yourmasterhostname';

  self.partout_ui_port = 11443;
  self.partout_api_port = 10443;

  //console.log('env:', process.env.NODE_ENV);

  if (global.INMOCHA) {
    self.database_name = 'partout-test';
  } else {
    self.database_name = 'partout';
  }

  self.database_url = 'http://root:yourdbpass@127.0.0.1:8529';

  // Settings
  self.event_rate_divisor = 100;
  self.aggregate_collection_period_secs_max = 60 * 60;   // 1 hour
  self.aggregate_collection_period_secs_min = 5;

  // After Pmax (above) is reached, we start to reduce the amount of detail in the aggregate events

  // Events per minute thresholds for aggregate detail level reduction
  self.em_threshold_obj = 500;
  self.em_threshold_mod = 2000;
  self.em_threshold_uuid = 5000;

  self.GITHUB_CLIENT_ID = "--insert-github-client-id-here--";
  self.GITHUB_CLIENT_SECRET = "--insert-github-client-secret-here--";

  self.MANIFESTDIR = 'etc/manifest';
};

module.exports = Cfg;
