/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true */
'use strict';

var console = require('better-console'),
    arangojs = require('arangojs'),
    Q = require('q');

var Db = function (cfg) {
  var self = this;

  if (!cfg) {
    throw new Error('cfg not passed to Db contstructor');
  }

  self.dbname = (cfg ? cfg.database_name : null);
  self.db = arangojs({
    promise: Q.promise,
    url: cfg.database_url
  });

};

Db.prototype.getDbName = function () {
  var self = this;
  return self.dbname;
};

Db.prototype.connect = function () {
  var self = this,
      deferred = Q.defer();
  // get list of databases
  self.db.listUserDatabases()
  .then(function (databases) {
    //console.warn('list databases:', databases);

    // Test if db exists
    var dbExists = (databases.filter(function (d) {
      return d === self.dbname;
    }).length > 0);
    //console.warn('db', self.dbname, 'exists:', dbExists);

    if (!dbExists) {
      // Create the database
      self.db.createDatabase(self.dbname)
      .then(function(info) {
        self.db.useDatabase(self.dbname);
        deferred.resolve('created');
      });
    } else {
      self.db.useDatabase(self.dbname);
      deferred.resolve('opened');
    }
  })
  .done(null, function(err) {
    //console.error(err);
    console.warn('Failed to talk to ArangoDB, maybe the service isn\'t running?');
    deferred.reject(new Error(err));
  });
  return deferred.promise;
};

Db.prototype.drop = function (name) {
  var self = this;
  return self.db.dropDatabase(name);
};

Db.prototype.getDb = function () {
  var self = this;
  return self.db;
};

module.exports = Db;
