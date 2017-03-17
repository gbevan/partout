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
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
//      'node_modules/es6-shim/es6-shim.js',
      'node_modules/core-js/client/shim.min.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/chart.js/dist/Chart.bundle.min.js',
      'node_modules/hammerjs/hammer.min.js',
//      'dist/bundle.js.map',
//      { pattern: 'dist/test.bundle.js', watched: false }
      { pattern: 'test/spec/*.ts', watched: false }
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
      'test/spec/*.ts': ['webpack', 'sourcemap'] //, 'inject-html']
    },

    injectHtml: {
        file: 'test/spec/index.html'
    },

    webpack: webpackConfig,

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


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
//      'karma-jasmine',
//      'karma-phantomjs-launcher',
//      'webpack',
//      'sourcemap'
//    ],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
