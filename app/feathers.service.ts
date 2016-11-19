////////////
// Feathers
const feathers        = require('feathers/client');
const socketio        = require('feathers-socketio/client');
const io              = require('socket.io-client');
const localstorage    = require('feathers-localstorage');
const hooks           = require('feathers-hooks');
const rest            = require('feathers-rest/client');
const authentication  = require('feathers-authentication/client');

///////////////
// REST
import { Injectable } from '@angular/core';
const superagent = require('superagent');

const HOST = 'https://127.0.0.1:11443'; // Your base server URL here
@Injectable()
export class RestService {
  private _app: any;
  constructor() {
    console.log('RestService constructor');
    this._app = feathers() // Initialize feathers
      .configure(rest(HOST).superagent(superagent)) // Fire up rest
      .configure(hooks()); // Configure feathers-hooks
  }

  getService(name) {
    console.log('RestService getService name:', name);
    console.log('feathers.service _app:', this._app);
    console.log('feathers.service _app.service:', this._app.service);
    console.log('feathers.service _app.service name:', this._app.service(name));
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

  constructor() {
//    super();
    console.log('SocketService constructor');
    this.socket = io(HOST);
    this._app = feathers()
      .configure(socketio(this.socket))
      .configure(hooks());
  }

  getService(name) {
    console.log('SocketService getService name:', name);
    return this._app.service(name);
  }

}
