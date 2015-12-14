/*jshint esnext: true*/
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
 * _key = ip
 * csr = Certificate signing request string
 */
var Csr = function (db) {
  var self = this;

  self.db = db;
  self.collectionName = 'csrs';
  self.collection = self.db.collection(self.collectionName);
};

/**
 * Check if collection needs creating.
 * @returns {Promise}
 */
Csr.prototype.init = function () {
  var self = this,
    deferred = Q.defer();

  self.db.listCollections()
  .then (function (collections) {

    var colExists = (collections.filter(function (d) {
      return d.name === self.collectionName;
    }).length > 0);


    if (colExists) {
      deferred.resolve('exists');
    } else {
      self.collection.create()
      .then(function () {
        console.log('csr collection:', self.collection);
        deferred.resolve('created');
      });
    }
  });
  return deferred.promise;
};

Csr.prototype.query = function (example) {
  var self = this;

  return self.collection.byExample(example);
};

Csr.prototype.all = function () {
  var self = this,
    deferred = Q.defer();
  //console.log('in csr.all() collection:', self.collection);
  self.collection.all('key')
  .then(function (cursor) {
    //console.log('cursor:', cursor);
    deferred.resolve(cursor.all());
  });
  return deferred.promise;
};

Csr.prototype.save = function (doc) {
  var self = this;

  return self.collection.save(doc);
};

Csr.prototype.register = function (ip, csr) {
  var self = this,
    deferred = Q.defer();

  // check if ip and csr already exist
  self.query({_key: ip})
  .then(function (docCursor) {
    //console.log('docCursor:', docCursor);

    if (docCursor.count === 0) {
      // Create new entry in csrs collection
      self.save({
        _key: ip,
        csr: csr,
        status: 'unsigned'
      })
      .then(function (doch) {
        self.collection.document(doch)
        .then(function (doc) {
          deferred.resolve(doc);
        });
      });
    } else {
      //console.log('csr already exists for', ip);
      docCursor.next()
      .then(function (doc) {
        //console.log('doc:', doc);
        if (doc.csr !== csr) {
          self.collection.update(doc._id, {csr: csr, status: 'unsigned'})
          .then(function () {
            deferred.resolve(doc);
          });
        } else {
          deferred.resolve(doc);
        }
      });
    }
  });
  return deferred.promise;
};

Csr.prototype.update = function (doc) {
  var self = this;
  self.collection.update(doc._id, doc);
};

module.exports = Csr;
