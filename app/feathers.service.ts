
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
//    .configure(authentication());
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
        console.log('Rest authenticate response:', response);
        return self._app.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.log('Rest JWT Payload', payload, 'userId:', payload.userId);
        return self._app.service('users').get(payload.userId);
      })
      .then(user => {
        console.log('Rest user api:', user);
        self._app.set('user', user);
        console.log('Rest User', self._app.get('user'));
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
    self.loggedIn = false;

//    super();
    console.log('SocketService constructor');
    self.socket = io(HOST);

    console.log('SocketService socket connected socket:', this.socket);
    self._app = feathers()
    .configure(socketio(self.socket, {timeout: 20000}))
    .configure(reactive(RxJS, {}))
    .configure(hooks())
    .configure(authentication({ storage: window.localStorage }));

    // If the transport changes, you have to call authenticate() again.
//    self.socket.io.engine.on('upgrade', function(transport) {
//      console.log('transport changed');
//      self._app.authenticate();
//    });
  }

  login(username, password) {
    var self = this;
    self.loggedIn = false;

    return new Promise<any>((resolve, reject) => {
      console.log('login username:', username, 'password:', password);

      self._app.authenticate({
        strategy: 'local',
        username: username,
        password: password
      })
      .then(response => {
        console.log('Socket authenticate response:', response);
        if (response) {
          self._app.user = response.data;
        } else {
          self._app.user = null;
        }

        return self._app.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.log('Socket JWT Payload', payload, 'userId:', payload.userId);
        return self._app.service('users').get(payload.userId);
      })
      .then(user => {
        console.log('Socket user api:', user);
        self._app.set('user', user);
        console.log('Socket User', self._app.get('user'));
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
