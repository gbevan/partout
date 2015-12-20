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

var Q = require('q'),
  Common = require('./common');

/**
 * Controller for the csrs collection.
 * (See common.js for inherited methods.)
 *
 * _key = ip
 * csr = Certificate signing request string
 */
var Csr = function (db) {
  var self = this;

  self.__proto__ = Common(db, 'csrs');


  self.register = function (ip, csr) {
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
};

module.exports = Csr;
