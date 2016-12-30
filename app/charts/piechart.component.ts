
import { Component, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as Rx from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'pie-chart',
  template: `

<div class="piecontainer">
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

  private data: any;

  // Doughnut
  public doughnutChartLabels:string[] = [];
  public doughnutChartData:number[] = [];
  public doughnutChartType:string = 'doughnut';

  public constructor(
  ) {
    this.data = [];
  }

  ngOnInit() {
    let sort = {};
    sort[this.field] = 1;

    this.rxservice.find({
      query: {
        $select: [this.field],
        $sort: sort
      },
      paginate: false,
      rx: {
        listStrategy: 'always'
      }
    })
    .subscribe(data => {
      let to = data
      .map(x => { return x[this.field]; })
      .reduce((acc, v) => {
        if (!acc[v]) {
          acc[v] = 0;
        }
        acc[v] += 1;
        return acc;
      }, {});

      this.doughnutChartLabels = [];
      this.doughnutChartData = [];
      _.map(to, (v:number, k:string) => {
        this.doughnutChartLabels.push(k);
        this.doughnutChartData.push(v);
      });

    });
  }

  chartClicked($event) {
    console.log('chart clicked');
  }

}
