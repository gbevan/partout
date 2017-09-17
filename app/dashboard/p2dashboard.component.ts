// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '../services/feathers.service';

import * as _ from 'lodash';
import * as Rx from 'rxjs';

import { AgentsService,
         AgentsAllService,
         CsrsService,
         CsrsAllService } from '../services/services.module';

const html = require('./p2dashboard.template.html');

const debug = require('debug').debug('partout:component:p2dashboard');

@Component({
  selector: 'p2-dashboard',
  template: html,
  styles: [`
.pie {
  height: 80%;
  width: 80%;
}
`]
})

export class P2DashboardComponent {
  private agentsTotal: number;
  private csrsTotal: number;

  public constructor(
    public agentsService: AgentsService,
    public agentsAllService: AgentsAllService,
    public csrsService: CsrsService,
    public csrsAllService: CsrsAllService
  ) { }

  ngOnInit() {

    this.agentsService
    .findRx({
      rx: {
        listStrategy: 'always'
      }
    })
    .map((data) => data.total)
    .subscribe(
      (total) => {
        this.agentsTotal = total;
      },
      (err) => {
        console.error('p2dashboard agentsService subscribe error:', err);
      }
    );

    this.csrsService
    .findRx({
      rx: {
        listStrategy: 'always'
      }
    })
    .map((data) => data.total)
    .subscribe(
      (total) => {
        this.csrsTotal = total;
      },
      (err) => {
        console.error('p2dashboard csrsService subscribe error:', err);
      }
    );
  }

}
