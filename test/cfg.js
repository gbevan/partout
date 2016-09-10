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

/*global describe, before, it, should*/
var assert = require('assert'),
  expect = require('expect'),
  Ca = require('../lib/ca'),
  rmdir = require('rmdir'),
  Q = require('q'),
  fs = require('fs'),
  pfs = require('../agent/lib/pfs'),
  path = require('path'),
  os = require('os');

global.should = require('should');
should.extend();

Q.longStackSupport = true;

describe('Cfg', function () {
  var cfg = new (require('../etc/partout.conf.js'))();

  it ('should exist', function () {
    should.exist(cfg);
  });

  describe('database name', function () {
    it ('should exist', function () {
      should.exist(cfg.database_name);
    });

    it ('should be partout-test', function () {
      cfg.database_name.should.equal('partout-test');
    });
  });
});
