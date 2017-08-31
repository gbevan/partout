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

  self.token = { secret: 'SECRET' };  // put a random hash secret here

  //console.log('env:', process.env.NODE_ENV);

  if (process.env.NODE_ENV === 'test') {
    self.database_name = 'partout-test';
  } else {
    self.database_name = 'partout';
  }

  self.waterline_config = {
    connections: {
      arangodb: {
        adapter: 'arangodb',
        host: '127.0.0.1',
        port: 8529,
        user: 'root',
        password: 'your_password',
        database: 'partout'
      }
    },
    defaults: {}
  };
  var dbcfg = self.waterline_config.connections.arangodb;
  self.database_url = 'http://' +
    dbcfg.user + ':' + dbcfg.password + '@' +
    dbcfg.host + ':' + dbcfg.port;

  // Settings
  self.event_rate_divisor = 100;
  self.aggregate_collection_period_secs_max = 60 * 60;   // 1 hour
  self.aggregate_collection_period_secs_min = 5;

  // After Pmax (above) is reached, we start to reduce the amount of detail in the aggregate events

  // Events per minute thresholds for aggregate detail level reduction
  self.em_threshold_obj = 500;
  self.em_threshold_mod = 2000;
  self.em_threshold_uuid = 5000;

//  self.GITHUB_CLIENT_ID = "--insert-github-client-id-here--";
//  self.GITHUB_CLIENT_SECRET = "--insert-github-client-secret-here--";

  self.MANIFESTDIR = 'etc/manifest';
  self.DEFAULT_ENVIRONMENT = 'default';
};

module.exports = Cfg;
