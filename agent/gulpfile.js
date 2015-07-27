/*jslint browser: true, node: true, vars: true*/
'use strict';

/*global */
var gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  gutil = require('gulp-util'),
  plugins = gulpLoadPlugins();

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
  return gulp.src(['test/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    }));
});

gulp.task('watch-mocha', function () {
  gulp.watch(['app.js', 'lib/**', 'test/**'], ['mocha']);
});

