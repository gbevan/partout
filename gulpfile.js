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
    v8 = require('v8');

//v8.setFlagsFromString('--trace_gc');
//v8.setFlagsFromString('--max_old_space_size=2048');
//v8.setFlagsFromString('--max_new_space_size=2048');

var cp = null;

var DEBUG = '';
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

gulp.task('clean', function () {
  return del('dist/**/*');
});

// copy dependencies
//gulp.task('copy:libs', ['clean'], function() {
//  return gulp.src([
//    'node_modules/core-js/client/shim.min.js',
//    'node_modules/zone.js/dist/zone.js',
//    'node_modules/reflect-metadata/Reflect.js',
//    'node_modules/systemjs/dist/system.src.js'
//  ])
//  .pipe(gulp.dest('dist/lib'));
//});

//gulp.task('compile', ['clean'], function () {
//  return gulp
//  .src('app/**/*.ts')
//  .pipe(sourcemaps.init())
//  .pipe(typescript(tsConfig.compilerOptions))
//  .pipe(sourcemaps.write('.'))
//  .pipe(gulp.dest('dist/app'));
//});

//gulp.task('app:css', ['compile'], function () {
//  return gulp
//  .src('app/**/*.css')
//  .pipe(gulp.dest('dist/app'));
//})

gulp.task('webpack', ['clean'], function () {
  return gulp.src('app/main.ts')
  .pipe(webpack(config, require('webpack')))
  .pipe(gulp.dest('dist'))
  ;
});

//gulp.task('run', ['compile'], function (done) {
gulp.task('run', ['webpack'], function (done) {
  // exec bin/partout
  console.log('starting partout');
  cp = spawn('bin/partout', {
    env: {
      NODE_ENV: env,
      DEBUG: DEBUG
    }, stdio: 'inherit'
  });

  done();
});

//gulp.task('chain', ['clean', 'compile', 'run']);
gulp.task('chain', ['clean', 'webpack', 'run']);

gulp.task('default', function () {
//  plugins.nodemon({
//    script: 'bollocks',
//    ignore: ['node_modules', 'agent', 'dist'],
//    tasks: ['clean'/*, 'copy:libs', 'compile', 'run'*/]
//  });
  watch([
    'gulpfile.js',
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
    verbose: true,
    readDelay: 1500 // filter duplicate changed events from Brackets
  }, batch(function (events, done) {
    if (cp) {
      console.log('killing');
      cp.kill();
    }
    gulp.start('chain', done);
  }));
});

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
    'gulpfile.js',
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
