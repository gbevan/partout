/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

// Karma configuration
var webpackConfig = require('./webpack.config.js');
//webpackConfig.entry = {};
//webpackConfig.entry = 'app/main.ts';
webpackConfig.devtool = 'inline-source-map';
webpackConfig.output.filename = 'test.bundle.js';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'jasmine-jquery', 'jasmine' ],


    // list of files / patterns to load in the browser
    files: [
//      'node_modules/es6-shim/es6-shim.js',
//      'node_modules/core-js/client/shim.min.js',
      'node_modules/core-js/client/core.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',
      'node_modules/zone.js/dist/sync-test.js',
      'node_modules/zone.js/dist/proxy.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/chart.js/dist/Chart.bundle.min.js',
      'node_modules/hammerjs/hammer.min.js',
//      'dist/bundle.js.map',
//      { pattern: 'dist/test.bundle.js', watched: false }
//      { pattern: 'test/spec/*.ts', watched: false }
      'app/main.spec.ts',
      './node_modules/@angular/material/prebuilt-themes/deeppurple-amber.css'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
//      'dist/test.bundle.js': ['webpack', 'sourcemap', 'inject-html'],
//      'dist/test.bundle.js': ['webpack', 'sourcemap'],
//      'test/spec/**/*.ts': ['babel']
//      'test/spec/*.ts': ['webpack', 'sourcemap'] //, 'inject-html']
      'app/main.spec.ts': ['webpack', 'sourcemap'],
      'app/**/!(*spec).ts': ['coverage']
    },

    injectHtml: {
        file: 'test/spec/index.html'
    },

    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
//    reporters: ['progress'],
    reporters: ['progress', 'coverage', 'remap-coverage'],

    // save interim raw coverage report in memory
    coverageReporter: {
      type: 'in-memory'
    },

    // define where to save final remaped coverage reports
    remapCoverageReporter: {
      'text-summary': null,
      html: './coverage/client/html'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],
//    browsers: ['Chrome'],

//    plugins: [
//      'karma-phantomjs-launcher',
//      'karma-jasmine-jquery',
//      'karma-jasmine'
////      'webpack',
////      'sourcemap'
//    ],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    captureTimeout: 60000,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
