/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, vars: true*/
'use strict';

var Q = require('q');

/**
 * Controller for the csrs collection.
 *
 * ip
 * csr
 */
var Csr = function (db) {
  var self = this;

  self.db = db;
  self.collectionName = 'csrs';

  var colfn = function () {
    var deferred = Q.defer();

    db.listCollections()
    .then (function (collections) {
      //console.log('collections:', collections);

      var colExists = (collections.filter(function (d) {
        return d.name === self.collectionName;
      }).length > 0);
      //console.log('colExists:', colExists);
      self.collection = db.collection('csrs');
      if (colExists) {
        deferred.resolve('exists');
      } else {
        self.collection.create()
        .then(function () {
          //console.log('csrs created');

          //console.log('csr collection:', self.collection);
          deferred.resolve('created');

          /*
          self.collection.save({
            test: 'data'
          })
          .then(function (doc) {
            console.log('doc:', doc);
            deferred.resolve('created');
          });
          */
        });
      }
    });
    return deferred.promise;
  };
  colfn()
  .then(function(status) {
    console.log('col:', status, 'collection:', self.collection);
    self.collection.count()
    .then(function (c) {
      console.log('count:', c);
    });
  });
};

Csr.prototype.query = function (keys) {
  var self = this;

  return self.collection.byExample(keys);
};

Csr.prototype.save = function (doc) {
  var self = this;

  return self.collection.save(doc);
};

Csr.prototype.register = function (ip, csr) {
  var self = this,
    deferred = Q.defer();

  // check if ip and csr already exist
  self.query({ip: ip})
  .then(function (docCursor) {
    console.log('docCursor:', docCursor);

    if (docCursor.count === 0) {
      // Create new entry in csrs collection
      self.save({
        ip: ip,
        csr: csr
      })
      .then(function () {
        deferred.resolve('csr registration created');
      });
    } else {
      console.log('csr already exists for', ip);
      docCursor.next()
      .then(function (doc) {
        console.log('doc:', doc);
        self.collection.update(doc._id, {csr: csr})
        .then(function () {
          deferred.resolve('csr registration updated');
        });
      });
    }
  });
  return deferred.promise;
};

module.exports = Csr;
