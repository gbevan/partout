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

/*jshint -W030 */

/*global describe, before, it, should, context*/
var cfg = new (require('../../etc/partout.conf.js'))(),
    db = new (require('../../lib/db.js'))(cfg),
    Agent = require('../../server/controllers/agent.js'),
    Q = require('q');

global.should = require('should');
should.extend();

Q.longStackSupport = true;

describe('Agent Controller', function () {
  var agent;
  before(function (done) {
    this.timeout(10000);
    agent = new Agent(db.getDb());
    agent.drop()
    .then(done);
  });

  it('should initialise a new collection', function (done) {
    agent.init()
    .then(function (agentres) {
      //console.log('agent collection init res:', agentres);
      should.exist(agentres);
      done();
    })
    .done(null, function (err) {
      //console.error('agent collection err:', err);
      //should(err).be.undefined();
      done(err);
    });

  });

  it('should present the agent controller object', function () {
    should.exist(agent);
  });

  it('should accept a valid agent document', function (done) {
    agent.upsert({
      _key: 'test1',
      ip: '127.0.0.1',
      env: 'default'
    })
    .then(function (docmeta) {
      should.exist(docmeta);
      docmeta._key.should.equal('test1');
      done();
    })
    .done(null, function (err) {
      done(err);
    });
  });

  it('should reject an invalid agent document', function (done) {
    agent.upsert({
      _key: 'test1',
      ip: '127.0.0.1',
      env: 'default',
      garbage: 'NOOOOO!'
    })
    .then(function (docmeta) {
      should.fail('reached code', 'to not reach code', 'upsert passed invalid document', 'upsert');
      done();
    })
    .done(null, function (err) {
      should(err).not.be.undefined();
      done();
    });
  });

  it('should reject an update to an agent document that tries to change the agent\'s environment', function (done) {
    agent.upsert({
      _key: 'test1',
      ip: '127.0.0.1',
      env: 'different'
    })
    .then(function () {
      should.fail('Reached', 'Not To Reach', 'agent update was allowed with a different environment', 'upsert');
      done();
    })
    .done(null, function (err) {
      should(err).not.be.undefined();
      done();
    });
  });

});
