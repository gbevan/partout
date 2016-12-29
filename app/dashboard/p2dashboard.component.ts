// Learning from https://github.com/valor-software/ng2-table (MIT License)

import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '../feathers.service';

import * as d3 from 'd3';
import * as _ from 'lodash';
import * as Rx from 'rxjs';

import { AgentsAllService } from '../agents_all.service';
import { CsrsAllService } from '../csrs_all.service';

const html = require('./p2dashboard.template.html');

@Component({
  selector: 'p2-dashboard',
  template: html,
  styles: [`

`]
})

export class P2DashboardComponent {

  private agents_env_counts: Rx.Observable<Array<any>>;

  public constructor(
    public agentsAllService: AgentsAllService,
    public csrsAllService: CsrsAllService
  ) {
    this.agents_env_counts = new Rx.Subject();
  }

  ngOnInit() {
  }

}
