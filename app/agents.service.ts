import { Injectable } from '@angular/core';
import { RestService, SocketService } from './feathers.service';
//console.log('RestService:', RestService, 'SocketService:', SocketService);

@Injectable()
export class AgentsService {
  private _socket;
  private _rest;

  constructor(
    private _socketService: SocketService, // <<<<<---- UNDEFINED WTF!!!!
    private _restService: RestService // <<<<<---- UNDEFINED WTF!!!!
  ) {
    console.log('constructor RestService:', RestService, 'SocketService:', SocketService);
    console.log('_restService:', _restService);
    console.log('_socketService:', _socketService);
    this._rest = _restService.getService('agents');
    this._socket = _socketService.getService('agents');
  }

  find(query: any) {
    return this._rest.find(query);
  }

  get(id: string, query: any) {
    return this._rest.get(id, query);
  }

  create(message: any) {
    return this._rest.create(message);
  }

  remove(id: string, query: any) {
    return this._socket.remove(id, query);
  }

}


