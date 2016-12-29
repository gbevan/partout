import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { RestService, SocketService } from './feathers.service';

@Injectable()
export class AgentsAllService {
  private _socket;
  private _rest;

  constructor(
    private _socketService: SocketService,
    private _restService: RestService
  ) {
    this._rest = _restService.getService('agents_all');
    this._socket = _socketService.getService('agents_all');

    this._socket.rx({
      listStrategy: 'always'
    });
  }

  public find(query: any) {
    return this._socket.find(query);
  }

  get(id: string, query: any) {
    return this._socket.get(id, query);
  }

  remove(id: string, query: any) {
    return this._socket.remove(id, query);
  }

}
