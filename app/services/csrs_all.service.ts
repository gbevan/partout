import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { SocketService } from './feathers.service';

@Injectable()
export class CsrsAllService {
  private _socket;

  constructor(
    private _socketService: SocketService,
  ) {
    this._socket = _socketService.getService('csrs_all');

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
