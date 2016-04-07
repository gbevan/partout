/*jslint browser: true, node: true, vars: true*/
'use strict';

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    gutil = require('gulp-util'),
    plugins = gulpLoadPlugins(),
    jsdoc = require('gulp-jsdoc3'),
    del = require('del'),
    console = require('better-console'),
    remoteTests = new (require('./lib/remote_tests'))(),
    Q = require('q'),
    u = require('util'),
    printf = require('printf'),
    os = require('os');

var env = process.env.NODE_ENV || 'development';
console.log('Invoking gulp -', env);

gulp.task('default', function () {
  plugins.nodemon({
    script: 'bin/partout-agent',
    env: { 'NODE_ENV': env},
    ignore: ['node_modules'],
    nodeArgs: ['--debug=5859']
  });
});

gulp.task('mocha', function () {
  var localStatus = 'OK';
  return gulp.src(['test/*.js', 'test/*.p2'], { read: false })
  .pipe(mocha({
    reporter: 'spec',
    globals: {
      should: require('should').noConflict()
      //inMocha: true
    }
  }))

  .once('error', function () {
    localStatus = 'FAILED';
  })

  .once('end', function (stat) {
    console.warn('stat:', stat);
    //console.info('Starting remote testers...');
    remoteTests.run()
    .then(function (test_promises) {
      //console.log('test_promises:', test_promises);
      return Q.all(test_promises);
    })
    .done(function (test_arr) {
      //console.log('test_arr:', test_arr);
      if (test_arr) {
        console.info('\n');
        console.info('Unit Test Summary:');
        console.info('==================\n');
        console.info(printf(
            '   %-15s %20s %7s %7s %25s : %6s',
            'Remote'.slice(0, 15),
            'Hostname'.slice(0, 20),
            'Arch'.slice(0, 7),
            'Platform'.slice(0, 8),
            'Release'.slice(0, 25),
            'Result'
          ));
        console.info(printf(
            '   %-15s %20s %7s %7s %25s : %6s',
            '------'.slice(0, 15),
            '--------'.slice(0, 20),
            '----'.slice(0, 7),
            '--------'.slice(0, 8),
            '-------'.slice(0, 25),
            '------'
          ));

        console.info(printf(
            '   %-15s %20s %7s %8s %25s : %6s',
            '*LOCAL',
            os.hostname().slice(0, 20),
            os.arch().slice(0, 7),
            os.platform().slice(0, 8),
            os.release().slice(0, 25),
            localStatus
          ));

        test_arr.forEach(function (t) {
          var conMethod = console.info;
          if (t.result !== 'OK') {
            conMethod = console.warn;
          }
          conMethod(printf(
            '   %-15s %20s %7s %8s %25s : %6s',
            t.remote.slice(0, 15),
            (t.test_result && t.test_result.hostname ? t.test_result.hostname : 'n/a').slice(0, 20),
            (t.test_result && t.test_result.arch ? t.test_result.arch : 'n/a').slice(0, 7),
            (t.test_result && t.test_result.platform ? t.test_result.platform : 'n/a').slice(0, 8),
            (t.test_result && t.test_result.release ? t.test_result.release : 'n/a').slice(0, 25),
            t.result
          ));
        });
        console.info('\n----\n');
      }
    });
  })
  ;
});

gulp.task('watch-mocha', function () {
  gulp.watch(['app.js', 'lib/**', 'test/**'], ['mocha']);
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
