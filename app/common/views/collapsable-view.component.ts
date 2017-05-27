import { Component, Input } from '@angular/core';

import * as _ from 'lodash';

const debug = require('debug').debug('partout:common:collapsable-view');

@Component({
  selector: 'collapsable-view',
  template: `
<span class="toggle"
      (click)="isCollapsed = !isCollapsed">{{ isCollapsed ? '&#9658;&nbsp;[...]' : '&#9660;' }}</span>
<div [ngbCollapse]="isCollapsed">
  <pre>{{ content }}</pre>
</div>
`,
  styles: [`
.toggle {
  cursor: pointer;
}
`]
})

export class CollapsableViewComponent {
  @Input() content: string = '';
  private isCollapsed: boolean = true;
}
