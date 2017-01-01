
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

///////////////
// REST
import { Injectable } from '@angular/core';
const superagent = require('superagent');

// TODO: make configurable
const HOST = 'https://officepc.net:11443'; // Your base server URL here

@Injectable()
export class RestService {
  private _app: any;

  public loggedIn: boolean;

  constructor() {
    let self = this;
    self.loggedIn = false;

    self._app = feathers() // Initialize feathers
    .configure(rest(HOST).superagent(superagent)) // Fire up rest
    .configure(hooks()) // Configure feathers-hooks
    .configure(authentication({ storage: window.localStorage }));
  }

  login(username, password) {
    var self = this;
    self.loggedIn = false;

    return new Promise<any>((resolve, reject) => {

      self._app.authenticate({
        strategy: 'local',
        username: username,
        password: password
      })
      .then(response => {
        return self._app.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        return self._app.service('users').get(payload.userId);
      })
      .then(user => {
        self._app.set('user', user);
        self.loggedIn = true;
        resolve('logged in');
      })
      .catch(function (err) {
        console.error('Rest authenticate err:', err);
        self.loggedIn = false;
        reject(err);
      });

    });
  }

  logout() {
    this.loggedIn = false;
    this._app.logout();
  }

  getApp() {
    return this._app;
  }

  getUser() {
    return this._app.get('user');
  }

  getService(name) {
    return this._app.service(name);
  }
}

///////////////////
// Socket.io
@Injectable()
export class SocketService {
  public socket: SocketIOClient.Socket; // see https://github.com/feathersjs/feathers-docs/issues/211 re @types/...
  private _app: any;

  public loggedIn: boolean;

  constructor() {
    let self = this;
    self.loggedIn = false;

//    super();
    self.socket = io(HOST);

    self._app = feathers()
    .configure(socketio(self.socket, {timeout: 20000}))
    .configure(reactive(RxJS, {}))
    .configure(hooks())
    .configure(authentication({ storage: window.localStorage }));
  }

  login(username, password) {
    var self = this;
    self.loggedIn = false;

    return new Promise<any>((resolve, reject) => {
      self._app.authenticate({
        strategy: 'local',
        username: username,
        password: password
      })
      .then(response => {
        if (response) {
          self._app.user = response.data;
        } else {
          self._app.user = null;
        }

        return self._app.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        return self._app.service('users').get(payload.userId);
      })
      .then(user => {
        self._app.set('user', user);
        self.loggedIn = true;
        resolve('logged in');
      })
      .catch(function (err) {
        console.error('Socket authenticate err:', err);
        self.loggedIn = false;
        reject(err);
      });

    });

  }

  logout() {
    this.loggedIn = false;
    this._app.logout();
  }

  getService(name) {
    return this._app.service(name);
  }

}
