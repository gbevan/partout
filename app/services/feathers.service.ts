import { Injectable, OnInit } from '@angular/core';

////////////
// Feathers
const feathers        = require('feathers/client');
const socketio        = require('feathers-socketio/client');
const io              = require('socket.io-client');
const localstorage    = require('feathers-localstorage');
const hooks           = require('feathers-hooks');
const rest            = require('feathers-rest/client');
const authentication  = require('feathers-authentication-client');

const reactive        = require('feathers-reactive');
const RxJS            = require('rxjs');

const debug = require('debug').debug('partout:service:feathers');

///////////////
// REST
// TODO: Remove REST support and focus on Realtime Socket.io for UI
const superagent = require('superagent');

///////////////////
// Socket.io
@Injectable()
export class SocketService {
  public socket: SocketIOClient.Socket; // see https://github.com/feathersjs/feathers-docs/issues/211 re @types/...
  public user: any = {};

  private _app: any;

  constructor() {
    this.user = {};

    this.socket = io(window.location.origin);

    this._app = feathers()
    .configure(socketio(this.socket, {timeout: 20000}))
    .configure(reactive(RxJS, {}))
    .configure(hooks())
    .configure(authentication({ storage: window.localStorage }));
  }

  init() {
    this.user = {};

    return new Promise<any>((resolve, reject) => {
      // try reauthenticate using stored JWT
      return this._app
      .authenticate()
      .then((response) => {
        this.handleAuthResponse(response);
        resolve();
      })
      .catch((err) => {
        console.warn('Socket reauthenticate err:', err);
        resolve(); // dont reject as jwt may not be available
      });
    });
  }

  login(username, password) {
    const self = this;
    this.user = {};

    return self._app.authenticate({
      strategy: 'local',
      username,
      password
    })
    .then((response) => { this.handleAuthResponse(response); });
  }

  logout() {
    this._app.logout();
    this.user = {};
  }

  getService(name) {
    return this._app.service(name);
  }

  getApp() {
    return this._app;
  }

  getUser() {
    return this._app.get('user');
  }

  private handleAuthResponse(response: any) {
    return this._app.passport.verifyJWT(response.accessToken)
    .then((payload) => {
      return this._app.service('users').get(payload.userId);
    })
    .then((user) => {
      this.user = user;
      this._app.set('user', user);
    });
  }

}
