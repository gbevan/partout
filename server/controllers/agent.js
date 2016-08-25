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
    assert = require('assert'),
    u = require('util');

/**
 * Controller for the agents collection.
 * (See common.js for inherited methods.)
 *
 * _key = agent uuid
 *
 */
var Agent = function (db) {
  var self = this;

  /*
   * _id and _key are implied
   */
  self.schema = {
    env: 'string',
    facts: 'object',
    ip: 'string',
    certInfo: 'object',
    lastSeen: 'date'
  };

  return Agent.super_.call(self, db, 'agents');

};
u.inherits(Agent, Common);

Agent.prototype.upsert = function (doc) {
  var self = this;
  assert(doc !== undefined);
  assert(doc._key !== undefined && doc._key !== '');

  if (!self._validDoc(doc)) {
    return Q.reject(new Error('Invalid document'));
  }

  return self.queryOne({_key: doc._key})
  .then(function (existing_doc) {
    if (existing_doc) {
      // Update
      if (doc.env !== existing_doc.env) {
        return Q.reject(new Error('Cannot change agent\'s environment after it has been signed'));
      }

      doc._id = existing_doc._id;
      return self.update(doc);
    } else {
      // create
      return self.save(doc);
    }
  });
};

module.exports = Agent;
