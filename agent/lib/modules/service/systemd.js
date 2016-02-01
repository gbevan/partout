/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true */
'use strict';

var console = require('better-console'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Q = require('q'),
    utils = new(require('../../utils'))(),
    u = require('util');

Q.longStackSupport = true;

Q.onerror = function (err) {
  console.error(err);
};

/**
 * Debian provider for the Service module.
 *
 * Service module
 * ==============
 *
 *  p2.service(
 *    'title',
 *    options,
 *    function (err) {
 *      ... to be called after applying any action ...
 *    }
 *  )
 *
 * Options:
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Name of the service to manage (defaults to title) |
 *   | ensure     | String  | stopped, running (defaults to stopped) |
 *   | enable     | Boolean | true, false |
 *   | provider   | String  | Override backend provider e.g.: debian, redhat, etc |
 */
var Service = function () {

};

module.exports = Service;
