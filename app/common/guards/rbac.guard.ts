import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { SocketService } from '../../services/feathers.service';

const debug = require('debug').debug('partout:guard:rbac');

@Injectable()
export class HasPermissionGuard implements CanActivate {
  constructor(private socketService: SocketService) {}

  /**
   * check user has permission:
   *   (p.type || '') + ':' +
   *   (p.subtype || '') + ':' +
   *   (p.name || '') +
   *   (p.access ? `:${p.access}` : '')
   *
   * e.g.:
   *   app:mainmenu:agents
   *   app:service:agents:RW
   */
  canActivate(permission): boolean {
//    return (this.socketService.socket ? this.socketService.socket['authenticated'] : false);
    return this.socketService.permissions[permission];
  }
}
