/*jslint node: true */
'use strict';

/*jshint -W030 */

/*global describe, before, it, should*/
var assert = require('assert'),
  expect = require('expect'),
  request = require('supertest'),
  express = require('express'),
  routerApi = express.Router(),
  bodyParser = require('body-parser'),
  Q = require('q'),
  fs = require('fs');
  //utils = new (require('../agent/lib/utils'))();

GLOBAL.should = require('should');
should.extend();

Q.longStackSupport = true;
