/*jslint node: true, nomen: true */
'use strict';

var _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec;

/**
 * @constructor
 * @description
 * Facts module
 * ============
 *
 * built-in module for gathering core facts.
 */

var Facts = function (cb) {
  var self = this;  // self is parents _impl

  return self;
};

/**
 * Return this module's name
 * @return {String} name of module
 */
Facts.getName = function () { return 'Facts'; };

/**
 * Return this module's discovered facts
 * @return {String} name of module
 */
Facts.getFacts = function () {
  var facts = {

    /***************************************
     * Gather facts about this agent system
     */

    platform: process.platform,
    arch: process.arch,

    node_version: process.version,
    node_versions: process.versions,

    os_type: os.type(),
    os_arch: os.arch(),
    os_release: os.release(),
    os_uptime: os.uptime(),
    os_loadavg: os.loadavg(),
    os_totalmem_bytes: os.totalmem(),
    os_freemem_bytes: os.freemem(),
    os_cpus: os.cpus(),
    os_numcpus: os.cpus().length,
    os_nics: os.networkInterfaces()
  };
  return facts;
};

module.exports = Facts;
