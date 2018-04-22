
import { Component, Input, OnInit } from '@angular/core';
import get from 'lodash-es/get';
import map from 'lodash-es/map';
import split from 'lodash-es/split';

const debug = require('debug').debug('partout:piechart');

@Component({
  selector: 'pie-chart',
  template: `

<div class="piecontainer"
     *ngIf="dataPresent">
  <h4>{{ title }}</h4>

  <div style="display: block">
    <canvas baseChart
            [data]="doughnutChartData"
            [labels]="doughnutChartLabels"
            [chartType]="doughnutChartType"
            (chartClick)="chartClicked($event)"></canvas>
  </div>

</div>
`,
  styles: [`
.piecontainer {
}
`]
})

export class PieChartComponent {

  @Input() title: string;
  @Input() rxservice: any;
  @Input() field: string;

  // Doughnut
  public doughnutChartLabels: string[] = [];
  public doughnutChartData: number[] = [];
  public doughnutChartType: string = 'doughnut';

  private dataPresent: boolean = false;

//  public constructor(
//  ) { }

  ngOnInit() {
    const sort = {};
    sort[this.field] = 1;

    const rootField = split(this.field, '.', 1)[0];

    this.rxservice.findRx({
      query: {
        $select: [rootField]
        // $sort: sort
      },
//      paginate: false,  set in *_all services on the server side
      rx: {
        listStrategy: 'always'
      }
    })
    .subscribe(
      (data) => {
        this.dataPresent = (data && data.length > 0);
//        if (data && data.length > 0) {
//          this.dataPresent = true;
//        } else {
//          this.dataPresent = false;
//        }
        const to = data
        .map((x) => {
          return get(x, this.field);
        })
        .sort()
        .reduce((acc, v) => {
          if (!acc[v]) {
            acc[v] = 0;
          }
          acc[v] += 1;
          return acc;
        }, {});

        this.doughnutChartLabels = [];
        this.doughnutChartData = [];
        map(to, (v: number, k: string) => {
          this.doughnutChartLabels.push(k);
          this.doughnutChartData.push(v);
        });
      },
      (err) => {
        console.error('pieChart subscribe error:', err);
      }
    );
  }

  chartClicked($event) {
    console.log('chart clicked');
  }

}
