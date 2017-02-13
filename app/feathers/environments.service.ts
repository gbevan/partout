import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { RestService, SocketService } from './feathers.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:service:environments');

@Injectable()
export class EnvironmentsService {
  private _socket;
  private _rest;

  constructor(
    private _socketService: SocketService,
    private _restService: RestService
  ) {
    this._rest = _restService.getService('environments');
    this._socket = _socketService.getService('environments');

    this._socket.rx({
      listStrategy: 'always'  //'smart'
    });
  }

  public find(query: any) {
    debug('find() query:', query);
    return this._socket.find(query);
  }

  public get(id: string, query: any) {
    debug('get() id:', id, query);
    return this._socket.get(id, query);
  }

  public remove(id: string, query: any) {
    debug('remove() id:', id, query);
    return this._socket.remove(id, query);
  }

  public update(id: string, environment: any) {
    debug('update() id:', id, environment);
    return this._socket.update(id, environment);
  }

}
