import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { SocketService } from './feathers.service';

// enable in browser console: localStorage.debug = 'partout:*'
const debug = require('debug').debug('partout:service:environments');

@Injectable()
export class EnvironmentsService {
  private _socket;

  constructor(
    private _socketService: SocketService,
  ) {
    this._socket = _socketService.getService('environments');

    this._socket.rx({
      listStrategy: 'always'
    });
  }

  public find(query?: any) {
    return this._socket.find(query);
  }

  public get(id: string, query?: any) {
    return this._socket.get(id, query);
  }

  public remove(id: string, query?: any) {
    return this._socket.remove(id, query);
  }

  public update(id: string, environment: any) {
    return this._socket.update(id, environment);
  }

  public patch(id: string, environment: any) {
    return this._socket.patch(id, environment);
  }

  public create(environment: any) {
    return this._socket.create(environment);
  }

}
