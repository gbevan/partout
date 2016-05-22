/*jslint browser: true, node: true, vars: true*/
'use strict';
global.INMOCHA = true;

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    gutil = require('gulp-util'),
    plugins = gulpLoadPlugins(),
    jsdoc = require('gulp-jsdoc3'),
    filter = require('gulp-filter'),
    del = require('del'),
    console = require('better-console'),
    remoteTests = new (require('./lib/remote_tests'))(),
    Q = require('q'),
    u = require('util'),
    printf = require('printf'),
    os = require('os'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch');

var env = process.env.NODE_ENV || 'development';
console.log('Invoking gulp -', env);

Q.longStackSupport = true;

var filter_files = filter(['**', '!**/files/*']);  // prevent test files from executing by gulp as tests in themselves

gulp.task('default', function () {
  plugins.nodemon({
    script: 'bin/partout-agent',
    env: { 'NODE_ENV': env},
    ignore: ['node_modules'],
    nodeArgs: ['--debug=5859']
  });
});

gulp.task('mocha1', function () {
  var localStatus = 'OK';
  return gulp.src(['test/**/*.js'], { read: false })
  .pipe(filter_files)
  .pipe(mocha({
    reporter: 'spec',
    globals: {
      should: require('should').noConflict()
    }
//    globals: ['INMOCHA']
  }));
});

gulp.task('mocha', function () {
  var localStatus = 'OK';
  return gulp.src(['test/**/*.js'], { read: false })
  .pipe(filter_files)
  .pipe(mocha({
    reporter: 'spec',
//    globals: {
//      should: require('should').noConflict()
//    }
  }))

  .once('error', function () {
    localStatus = 'FAILED';
  })

  .once('end', function (stat) {
    //console.warn('stat:', stat);
    //console.info('Starting remote testers...');
    remoteTests.run()
    .then(function (test_promises) {
      //console.log('test_promises:', test_promises);
      return Q.all(test_promises);
    })
    .done(function (test_arr) {
      //console.log('test_arr:', test_arr);
      var conMethod;

      if (test_arr) {
        console.info('\n');
        console.info('Unit Test Summary:');
        console.info('==================\n');
        console.info(printf(
          '   %-15s %20s %7s %7s %15s %30s : %10s %s',
          'Remote'.slice(0, 15),
          'Hostname'.slice(0, 20),
          'Arch'.slice(0, 7),
          'Platform'.slice(0, 8),
          'Release'.slice(0, 15),
          'OS'.slice(0, 30),
          'Result'.slice(0, 10),
          'TimeTaken'
        ));
        console.info(printf(
          '   %-15s %20s %7s %7s %15s %30s : %10s %s',
          '------'.slice(0, 15),
          '--------'.slice(0, 20),
          '----'.slice(0, 7),
          '--------'.slice(0, 8),
          '-------'.slice(0, 15),
          '--'.slice(0, 30),
          '------'.slice(0, 10),
          '---------'
        ));

        conMethod = console.info;
        if (localStatus !== 'OK') {
          conMethod = console.warn;
        }
        conMethod(printf(
          '   %-15s %20s %7s %8s %15s %30s : %10s',
          '*LOCAL',
          os.hostname().slice(0, 20),
          os.arch().slice(0, 7),
          os.platform().slice(0, 8),
          os.release().slice(0, 15),
          '',
          localStatus.slice(0, 10)
        ));

        test_arr.forEach(function (t) {
          conMethod = console.info;
          if (t.result !== 'OK') {
            conMethod = console.warn;
          }
          //console.log('t:', t);
          conMethod(printf(
            '   %-15s %20s %7s %8s %15s %30s : %10s %d ms',
            t.remote.slice(0, 15),
            (t.test_result && t.test_result.hostname ? t.test_result.hostname : 'n/a').slice(0, 20),
            (t.test_result && t.test_result.arch ? t.test_result.arch : 'n/a').slice(0, 7),
            (t.test_result && t.test_result.platform ? t.test_result.platform : 'n/a').slice(0, 8),
            (t.test_result && t.test_result.release ? t.test_result.release : 'n/a').slice(0, 15),
            (t.test_result && t.test_result.os ? t.test_result.os : 'n/a').slice(0, 30),
            t.result.slice(0, 10),
            (t.test_result && !isNaN(t.test_result.time_taken) ? t.test_result.time_taken : -2)
          ));
        });
        console.info('\n----\n');
      }
      //process.exit();
      //exit();
    });
  })
  ;
});

gulp.task('watch-mocha', function () {
  watch([
    'gulpfile.js',
    'app.js',
    'lib/**',
    'test/**'
  ], {
    ignoreInitial: false,
    verbose: false,
    readDelay: 1500 // filter duplicate changed events from Brackets
  }, batch(function (events, done) {
    gulp.start('mocha', done);
  }));
});

gulp.task('docs', function (cb) {
  del(['./jsdocs/**']);
  gulp.src(['./app.js', 'lib/**/*.*', 'etc/**/*.p2', './README.md'])
    .pipe(jsdoc(
    {
      opts: {
        destination: './jsdocs'
      },
      plugins: [
        'plugins/markdown'
      ],
      templates: {
        "cleverLinks": false,
        "monospaceLinks": false,
        "default": {
          "outputSourceFiles": true
        },
        "path": "ink-docstrap",
        "theme": "cerulean",
        "navType": "vertical",
        "linenums": true,
        "dateFormat": "MMMM Do YYYY, h:mm:ss a"
      }
    },
    cb
  ));
});
