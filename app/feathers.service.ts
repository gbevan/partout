
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
    console.log('RestService constructor');
    let self = this;
    self.loggedIn = false;

    self._app = feathers() // Initialize feathers
    .configure(rest(HOST).superagent(superagent)) // Fire up rest
    .configure(hooks()) // Configure feathers-hooks
    .configure(authentication());
  }

  login(email, password) {
    var self = this;
    self.loggedIn = false;

    return new Promise<any>((resolve, reject) => {

      self._app.authenticate({
        strategy: 'local',
        email: email,
        password: password
      })
      .then(response => {
        console.log('Rest authenticate response:', response);
        return self._app.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.log('JWT Payload', payload);
        return self._app.service('users').get(payload.userId);
      })
      .then(user => {
        self._app.set('user', user.data[0]);
        console.log('User', self._app.get('user'));
        self.loggedIn = true;
        resolve('logged in');
      })
      .catch(function (err) {
        console.error('Rest authenticate err:', err.code);
        self.loggedIn = false;
        reject(err);
      });

    });
  }

  logout() {
    this.loggedIn = false;
    this._app.logout();
    console.log('REST logged out');
  }

  getApp() {
    return this._app;
  }

  getUser() {
    return this._app.get('user');
  }

  getService(name) {
    console.log('RestService getService name:', name);
    console.log('feathers.service _app:', this._app);
    console.log('feathers.service _app.service:', this._app.service);
    console.log('feathers.service _app.service by name:', this._app.service(name));
    return this._app.service(name);
  }
}

///////////////////
// Socket.io
@Injectable()
// export class SocketService extends Service {
export class SocketService {
  public socket: SocketIOClient.Socket; // see https://github.com/feathersjs/feathers-docs/issues/211 re @types/...
  private _app: any;

  public loggedIn: boolean;

  constructor() {
    let self = this;

//    super();
    console.log('SocketService constructor');
    self.socket = io(HOST);

    console.log('SocketService socket connected socket:', this.socket);
    self._app = feathers()
    .configure(socketio(self.socket, {timeout: 20000}))
    .configure(reactive(RxJS, {}))
    .configure(hooks())
    .configure(authentication({ storage: window.localStorage }));
  }

  login(email, password) {
    var self = this;
    self.loggedIn = false;

    return new Promise<any>((resolve, reject) => {

      self._app.authenticate({
        strategy: 'local',
        email: email,
        password: password
      })
      .then(function (result) {
        console.log('Socket authenticate result:', result);
        if (result) {
          self._app.user = result.data;
        } else {
          self._app.user = null;
        }
        console.log('user:', self._app.user);
        console.log('user:', self._app.get('user'));
        console.log('token:', self._app.get('token'));
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
    console.log('Socket logged out');
  }

  getService(name) {
    console.log('SocketService getService name:', name);
    return this._app.service(name);
  }

}
