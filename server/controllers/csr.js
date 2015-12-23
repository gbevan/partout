/*jshint newcap: false, esnext: true*/
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
  Common = require('./common'),
  uuid = require('node-uuid');

/**
 * Controller for the csrs collection.
 * (See common.js for inherited methods.)
 *
 * _key = ip
 * csr = Certificate signing request string
 */
var Csr = function (db) {
  var self = this;

  //self.__proto__ = Common(db, 'csrs');
  Object.setPrototypeOf(self, Common(db, 'csrs'));


  self.register = function (agent_uuid, ip, csr) {
    var self = this,
      deferred = Q.defer(),
      now = new Date();
    console.log('agent_uuid:', agent_uuid);

    // check if csr already exist for this agent's uuid (if one present)
    var p;
    if (agent_uuid) {
      p = self.query({_key: agent_uuid});
    } else {
      p = Q.resolve({count: 0}); //fake empty query
    }
    console.log('p:', p);
    p.then(function (docCursor) {
      console.log('docCursor:', docCursor);

      if (docCursor.count === 0) {
        // Create new entry in csrs collection
        var newDoc = {
          _key: ((agent_uuid && agent_uuid !== '') ? agent_uuid : uuid.v4()),
          ip: ip,
          csr: csr,
          status: 'unsigned',
          lastSeen: now
        };
        console.log('newDoc:', newDoc);
        self.save(newDoc)
        .then(function (doch) {
          console.log('doch:', doch);
          self.collection.document(doch)
          .then(function (doc) {
            console.log('doc:', doc);
            deferred.resolve(doc);
          });
        })
        .done();

      } else {
        //console.log('csr already exists for', ip);
        docCursor.next()
        .then(function (doc) {
          //console.log('doc:', doc);
          self.collection.update(doc._id, {
            csr: csr,
            status: 'unsigned',
            lastSeen: now
          })
          .then(function () {
            deferred.resolve(doc);
          });
        })
        .done();
      }
    })
    .done();
    return deferred.promise;
  };
};

module.exports = Csr;
