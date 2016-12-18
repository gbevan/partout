import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { RestService, SocketService } from './feathers.service';

@Injectable()
export class AgentsService {
  private _socket;
  private _rest;

//  public items$: Observable<{}>;
//
//  private itemsObserver: Observer<any[]>;
//  private dataStore: {
//    items: any[]
//  };

  constructor(
    private _socketService: SocketService,
    private _restService: RestService
  ) {
    this._rest = _restService.getService('agents');
    this._socket = _socketService.getService('agents');

//    console.log('agents.services.ts _rest:', this._rest);
//    console.log('agents.services.ts _socket:', this._socket);

//    this._socket.on('created', (newItem) => this.onCreated(newItem));
//    this._socket.on('updated', (updatedItem) => this.onUpdated(updatedItem));
//    this._socket.on('removed', (removedItem) => this.onRemoved(removedItem));

//    this.items$ = new Observable(observer => this.itemsObserver = observer)
//      .share();

//    this.dataStore = { items: [] };

    this._socket.rx({
      listStrategy: 'smart'
    });
  }

  public find(query: any) {
//    console.log('agents.service: find query:', query);
//    return this._rest.find(query);
    return this._socket.find(query);
  }

  get(id: string, query: any) {
    return this._socket.get(id, query);
  }

//  create(message: any) {
//    return this._rest.create(message);
//  }

  remove(id: string, query: any) {
    return this._socket.remove(id, query);
  }


//  private getIndex(id: string): number {
//    let foundIndex = -1;
//
//    for (let i = 0; i < this.dataStore.items.length; i++) {
//      if (this.dataStore.items[i].id === id) {
//        foundIndex = i;
//      }
//    }
//
//    return foundIndex;
//  }
//
//  private onCreated(newItem: any) {
//    this.dataStore.items.push(newItem);
//
//    this.itemsObserver.next(this.dataStore.items);
//  }
//
//  private onUpdated(updatedItem: any) {
//    const index = this.getIndex(updatedItem.id);
//
//    this.dataStore.items[index] = updatedItem;
//
//    this.itemsObserver.next(this.dataStore.items);
//  }
//
//  private onRemoved(removedItem) {
//    const index = this.getIndex(removedItem.id);
//
//    this.dataStore.items.splice(index, 1);
//
//    this.itemsObserver.next(this.dataStore.items);
//  }


}


