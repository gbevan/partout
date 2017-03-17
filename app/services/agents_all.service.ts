import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { SocketService } from './feathers.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:service:agents_all');

@Injectable()
export class AgentsAllService {
  private _socket;

  constructor(
    private _socketService: SocketService,
  ) {
    this._socket = _socketService.getService('agents_all');

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

}
