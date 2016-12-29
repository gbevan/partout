
import { Component, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as Rx from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'pie-chart',
  template: `

<div class="piecontainer">
  <h3>{{ title }}</h3>

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
  max-width: 300px;
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
    console.log('pie chart');
    this.data = [];
  }

  ngOnInit() {
    console.log('piechart ngOnInit() field:', this.field, 'data:', this.data);

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
      console.log('piechart subscribe data:', data);

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

//        let rec:any = {};
//        rec[this.field] = k;
//        rec.count = v;

        this.doughnutChartLabels.push(k);
        this.doughnutChartData.push(v);

//        return rec;
      });

    });
  }

  chartClicked($event) {
    console.log('chart clicked');
  }

}
