/*jslint browser: true, node: true, vars: true*/
'use strict';

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    gutil = require('gulp-util'),
    plugins = gulpLoadPlugins(),
    jsdoc = require('gulp-jsdoc3'),
    del = require('del'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    typescript = require('gulp-typescript'),
    webpack = require('webpack-stream'),
    config = require('./webpack.config.js'),
    tsConfig = require('./tsconfig.json'),
    spawn = require('child_process').spawn,
    sourcemaps = require('gulp-sourcemaps'),
    v8 = require('v8'),
    Server = require('karma').Server;

//v8.setFlagsFromString('--trace_gc');
//v8.setFlagsFromString('--max_old_space_size=2048');
//v8.setFlagsFromString('--max_new_space_size=2048');

var cp = null;

//var DEBUG = '';
//var DEBUG = 'partout:*';
//var DEBUG = 'feathers-authentication:main';
//var DEBUG = 'feathers-authentication:authentication:utils';
//var DEBUG = 'sails-arangodb:connection, sails-arangodb:adapter, partout:app';
//var DEBUG = 'feathers-authentication-local:verify';
//var DEBUG = 'api:routes';

/*
 * Currently env does not determine the arangodb being selected here, as all
 * tests are using a mock-up of any required controllers.  This will probably
 * change in the near future when unit-tests come out of the current fine-
 * granularity and in to wider more inclusive tests (e.g. from the app itself).
 */
var env = process.env.NODE_ENV || 'development';

//gulp.task('clean', function () {
//  return del('dist/**/*');
//});

// Webpack does its own watching, see weback.config.js
gulp.task('webpack', function () {
  // delay to let gulp start up the app
  setTimeout(function () {
  gulp.src('app/main.ts')
  .pipe(
    webpack(config, require('webpack'))
    .on('error', function (err) {
      gutil.log('WEBPACK ERROR:', err);
      if (cp) {
        console.log('killing partout');
        cp.kill();
      }
      this.emit('end');
    })
  )
  .pipe(gulp.dest('dist'));
  }, 3000);
});

//gulp.task('run', ['compile'], function (done) {
gulp.task('run', function (done) {
  // exec bin/partout
  console.log('starting partout');
  cp = spawn('bin/partout', {
    env: {
      NODE_ENV: env,
      DEBUG: process.env.DEBUG
    }, stdio: 'inherit'
  });

  done();
});

//gulp.task('chain', ['webpack', 'run']);

gulp.task('watch', function () {
  watch([
//    'systemjs.config.js',
    'app.js',
    'appApi.js',
    'appUi.js',
//    'app/**',
    'lib/**',
    'etc/*.js',
    'etc/*.json',
    'agent/lib/utils/**/*.js',
    'agent/lib/pfs.js',
    'server/**/*.js',
    'public/**/*.js',
    //'public/views/*.html',
//    'test/**'
  ], {
    ignoreInitial: false,
    verbose: true,
    readDelay: 2000 // filter duplicate changed events from Brackets
  }, batch(function (events, done) {
    if (cp) {
      console.log('killing partout');
      cp.kill();
    }
    gulp.start('run', done);
  }));
});

gulp.task('default', ['watch', 'webpack']);

gulp.task('mocha', function () {
  global.INMOCHA = true;
  return gulp.src(['test/**/*.js'], { read: false })
  .pipe(mocha({
    reporter: 'spec',
    globals: {
      should: require('should').noConflict()
    }
  }));
});

gulp.task('watch-mocha', function () {
  watch([
    'systemjs.config.js',
    'app.js',
    'appApi.js',
    'appUi.js',
    'app/**',
    'lib/**',
    'etc/*.js',
    'agent/lib/utils/**/*.js',
    'agent/lib/pfs.js',
    'server/**/*.js',
    'public/**/*.js',
    //'public/views/*.html',
    'test/**'
  ], {
    ignoreInitial: false,
    verbose: false,
    readDelay: 1500 // filter duplicate changed events from Brackets
  }, batch(function (events, done) {
    gulp.start('mocha', done);
  }));
});

// Karma / Jasmine
gulp.task('karma', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
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
