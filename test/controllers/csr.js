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
    Csr = require('../../server/controllers/csr.js'),
    Q = require('q');

var should = require('should');
//should.extend();

Q.longStackSupport = true;

describe('Csr Controller', function () {
  var csr;
  before(function (done) {
    this.timeout(10000);
    csr = new Csr(db.getDb());
    csr.drop()
    .then(done);
  });

  it('should initialise a new collection', function (done) {
    csr.init()
    .then(function (csrres) {
      //console.log('csr collection init res:', csrres);
      should.exist(csrres);
      done();
    })
    .done(null, function (err) {
      //console.error('csr collection err:', err);
      //should(err).be.undefined();
      done(err);
    });

  });

  it('should present the csr controller object', function () {
    should.exist(csr);
  });

  it('should register a csr request', function (done) {
    csr.register('uuid', 'ip', 'csr', 'default')
    .then(function (doc) {
      //console.log('csr doc:', doc);
      should(doc.status).not.be.undefined();
      doc.status.should.equal('unsigned');

      // TODO: verify agent has also been created
      done();
    })
    .done(null, function (err) {
      done(err);
    });
  });

});
