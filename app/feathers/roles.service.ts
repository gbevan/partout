import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { RestService, SocketService } from './feathers.service';

@Injectable()
export class RolesService {
  private _socket;
  private _rest;

  constructor(
    private _socketService: SocketService,
    private _restService: RestService
  ) {
    this._rest = _restService.getService('roles');
    this._socket = _socketService.getService('roles');

    this._socket.rx({
      listStrategy: 'always'
    });
  }

  public find(query: any) {
    return this._socket.find(query);
  }

  public get(id: string, query: any) {
    return this._socket.get(id, query);
  }

  public remove(id: string, query: any) {
    return this._socket.remove(id, query);
  }

  public update(id: string, csr: any) {
    return this._socket.update(id, csr);
  }

}
