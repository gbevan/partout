/*jslint browser: true, node: true, vars: true*/
'use strict';

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    gutil = require('gulp-util'),
    plugins = gulpLoadPlugins(),
    jsdoc = require('gulp-jsdoc3'),
    del = require('del');

/*
 * Currently env does not determine the arangodb being selected here, as all
 * tests are using a mock-up of any required controllers.  This will probably
 * change in the near future when unit-tests come out of the current fine-
 * granularity and in to wider more inclusive tests (e.g. from the app itself).
 */
var env = process.env.NODE_ENV || 'development';

gulp.task('default', function () {
  plugins.nodemon({
    script: 'bin/partout',
    env: { 'NODE_ENV': env},
    ignore: ['node_modules', 'agent'],
    nodeArgs: ['--debug']
  });
});

gulp.task('mocha', function () {
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should').noConflict()
      }
    }));
});

gulp.task('watch-mocha', function () {
  gulp.watch(['app.js', 'lib/**', 'etc/*.js', 'agent/lib/*.js', 'test/**'], ['mocha']);
});

gulp.task('docs', function (cb) {
  del(['./jsdocs/**']);
  gulp.src(['./app.js', 'lib/**/*.js', 'etc/**/*.p2', './README.md'])
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
