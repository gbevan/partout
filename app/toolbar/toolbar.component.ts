import { Component } from '@angular/core';

import { SocketService } from '../services/services.module';

const debug = require('debug').debug('partout:component:toolbar');
const html = require('./toolbar.template.html');
const css = require('./toolbar.css');

@Component({
  selector: 'partout-toolbar',
  template: html,
  styles: [css]
})

export class ToolbarComponent {
  constructor(
    private socketService: SocketService
  ) {}

  logout() {
    this.socketService.logout();
  }
}
