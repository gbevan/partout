/*global System*/
(function (global) {
  System.config({
    paths: {
      // paths serve as alias
      'npm:': 'node_modules/'
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: 'dist/app',

      // angular bundles
      '@angular/core':                  'npm:@angular/core/bundles/core.umd.js',
      '@angular/common':                'npm:@angular/common/bundles/common.umd.js',
      '@angular/compiler':              'npm:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser':      'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http':                  'npm:@angular/http/bundles/http.umd.js',
      '@angular/router':                'npm:@angular/router/bundles/router.umd.js',
      '@angular/forms':                 'npm:@angular/forms/bundles/forms.umd.js',
      '@angular/upgrade':               'npm:@angular/upgrade/bundles/upgrade.umd.js',
      // other libraries
      'rxjs':                           'npm:rxjs',
      'angular-in-memory-web-api':      'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js',

      // Feathers
      'debug':                          'npm:debug',
      'events':                         'npm:events',
      'feathers':                       'npm:feathers',
      'feathers-socketio':              'npm:feathers-socketio',
      'socket.io-client':               'npm:socket.io-client',
      'feathers-localstorage':          'npm:feathers-localstorage',
      'feathers-hooks':                 'npm:feathers-hooks',
      'feathers-hooks-common':          'npm:feathers-hooks-common',
      'feathers-socket-commons':        'npm:feathers-socket-commons',
      'feathers-commons':               'npm:feathers-commons',
      'feathers-rest':                  'npm:feathers-rest',
      'feathers-errors':                'npm:feathers-errors',
      'feathers-authentication':        'npm:feathers-authentication',
      'ms':                             'npm:ms',
      'qs':                             'npm:qs',
      'rubberduck':                     'npm:rubberduck',
      'superagent':                     'npm:superagent',
      'uberproto':                      'npm:uberproto'
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        main: './main.js',
        defaultExtension: 'js'
      },
      'debug': {
        main: './debug.js',
        defaultExtension: 'js'
      },
      'events': {
        main: './events.js',
        defaultExtension: 'js'
      },
      'feathers': {
        defaultExtension: 'js'
      },
      'feathers-authentication': {
        defaultExtension: 'js'
      },
      'feathers-commons': {
        main: './lib/commons.js',
        defaultExtension: 'js'
      },
      'feathers-errors': {
        main: './lib/index.js',
        defaultExtension: 'js'
      },
      'feathers-hooks': {
        main: './lib/hooks.js',
        defaultExtension: 'js'
      },
      'feathers-hooks-common': {
        defaultExtension: 'js'
      },
      'feathers-socket-commons': {
//        main: './lib/hooks.js',
        defaultExtension: 'js'
      },
      'feathers-localstorage': {
        main: './dist/localstorage.js',
        defaultExtension: 'js'
      },
      'feathers-rest': {
        defaultExtension: 'js'
      },
      'feathers-socketio': {
        defaultExtension: 'js'
      },
      ms: {
        main: './index.js',
        defaultExtension: 'js'
      },
      qs: {
        main: './dist/qs.js',
        defaultExtension: 'js'
      },
      rubberduck: {
        main: './dist/rubberduck.js',
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      },
      'socket.io-client': {
        main: './socket.io.js',
        defaultExtension: 'js'
      },
      'superagent': {
        main: './superagent.js',
        defaultExtension: 'js'
      },
      'uberproto': {
        main: './proto.min.js',
        defaultExtension: 'js'
      }
    }
  });
})(this);
