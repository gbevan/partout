import { Injectable, OnInit } from '@angular/core';

////////////
// Feathers
const feathers        = require('feathers/client');
const socketio        = require('feathers-socketio/client');
const io              = require('socket.io-client');
const localstorage    = require('feathers-localstorage');
const hooks           = require('feathers-hooks');
const authentication  = require('feathers-authentication-client');

const reactive        = require('feathers-reactive');
const RxJS            = require('rxjs');

const debug = require('debug').debug('partout:service:feathers');

///////////////////
// Socket.io
@Injectable()
export class SocketService {
  public socket: SocketIOClient.Socket; // see https://github.com/feathersjs/feathers-docs/issues/211 re @types/...
  public user: any = {};
  public permissions: any = {};

  private _app: any;

  constructor() {
    this.resetUser();

    this.socket = io(window.location.origin);

    this._app = feathers()
    .configure(socketio(this.socket, {timeout: 20000}))
    .configure(reactive(RxJS, {}))
    .configure(hooks())
    .configure(authentication({ storage: window.localStorage }));
  }

  resetUser() {
    this.user = {};
    this.permissions = {};
  }

  init() {
    this.resetUser();

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
    this.resetUser();

    return self._app.authenticate({
      strategy: 'local',
      username,
      password
    })
    .then((response) => {
      debug('login() response:', response);
      this.handleAuthResponse(response);
    });
  }

  logout() {
    this._app.logout();
    this.resetUser();
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

      // get user's permissions
      const promises = [];
      this.user.roles.forEach((role) => {
        debug('handleAuthResponse() role:', role);

        promises.push(this._app.service('roles')
        .find({query: {name: role.name}})
        .subscribe((role_res) => {
          if (role_res.total === 1) {
//            this.permissions = this.permissions.concat(role_res.data[0].permissions);
            role_res.data[0].permissions.forEach((p) => {
              this.permissions[
                (p.type || '') + ':' +
                (p.subtype || '') + ':' +
                (p.name || '') +
                (p.access ? `:${p.access}` : '')
              ] = true;
            });
            debug('accum permissions:', this.permissions);
          } else {
            debug('role_res returned:', role_res.total);
          }
        }));
      });
      return Promise.all(promises);
    });
  }

}
