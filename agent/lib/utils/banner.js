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

/*jslint node: true, nomen: true, vars: true*/
/*jshint multistr: true*/
'use strict';

var console = require('better-console'),
    u = require('util');

/**
 * Banner utils
 *
 * @mixin
 */

var UtilsBanner = function () {
};

UtilsBanner.prototype.bannerInit = function () {
  var self = this;

  self.banner = "\n\
'########:::::'###::::'########::'########::'#######::'##::::'##:'########:\n\
 ##.... ##:::'## ##::: ##.... ##:... ##..::'##.... ##: ##:::: ##:... ##..::\n\
 ##:::: ##::'##:. ##:: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ########::'##:::. ##: ########::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##.....::: #########: ##.. ##:::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##.... ##: ##::. ##::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##:::: ##: ##:::. ##:::: ##::::. #######::. #######::::: ##::::\n\
..:::::::::..:::::..::..:::::..:::::..::::::.......::::.......::::::..:::::\n\
License: GPLv3\n\
Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>\n\
";
};

/**
 * Print the Partout banner
 */
UtilsBanner.prototype.print_banner = function () {
  var self = this;
  console.info(self.banner);
};

/**
 * Return the Partout banner
 * @returns {string} Banner string
 */
UtilsBanner.prototype.getBanner = function () {
  var self = this;
  return self.banner;
};

module.exports = UtilsBanner;
