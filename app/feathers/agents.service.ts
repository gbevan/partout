import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { RestService, SocketService } from './feathers.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:service:agents');

@Injectable()
export class AgentsService {
  private _socket;
  private _rest;

  constructor(
    private _socketService: SocketService,
    private _restService: RestService
  ) {
    this._rest = _restService.getService('agents');
    this._socket = _socketService.getService('agents');

    this._socket.rx({
      listStrategy: 'always'
    });
  }

  public find(query: any) {
    debug('find() query:', query);
    return this._socket.find(query);
  }

  get(id: string, query: any) {
    debug('get() id:', id, query);
    return this._socket.get(id, query);
  }

  remove(id: string, query: any) {
    debug('remove() id:', id, query);
    return this._socket.remove(id, query);
  }

  patch(id: string, obj: any) {
    debug('patch() id:', id, obj);
    return this._socket.patch(id, obj);
  }

}
