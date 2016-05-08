#!/usr/bin/env node
/*
 * Test app for creating a Service - for unit testing
 */

/*jslint node: true, nomen: true */
'use strict';

var express = require('express'),
    app = express(),
    port = 47231;

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!');
});
