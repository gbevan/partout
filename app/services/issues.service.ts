import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { SocketService } from './feathers.service';

const debug = require('debug').debug('partout:service:issues');

@Injectable()
export class IssuesService {
  private _socket;

  constructor(
    private _socketService: SocketService,
  ) {
    this._socket = _socketService.getService('issues');

    this._socket.rx({
      listStrategy: 'always'
    });
  }

  public find(query: any) {
    return this._socket.find(query);
  }

  public findRx(query: any) {
    debug('findRx() query:', query);
    return this._socket
    .watch()
    .find(query);
  }

  public get(id: string, query?: any) {
    return this._socket.get(id, query);
  }

  public getRx(id: string, query?: any) {
    return this._socket
    .watch()
    .get(id, query);
  }

  public remove(id: string, query?: any) {
    return this._socket.remove(id, query);
  }

  public update(id: string, role: any) {
    return this._socket.update(id, role);
  }

  public patch(id: string, role: any) {
    return this._socket.patch(id, role);
  }

  public create(role: any) {
    return this._socket.create(role);
  }

}
