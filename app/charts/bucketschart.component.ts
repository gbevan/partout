
import { Component,
         Input,
         OnChanges } from '@angular/core';
import * as _ from 'lodash';

const debug = require('debug').debug('partout:bucketschart');

@Component({
  selector: 'buckets-chart',
  template: `

<div>
  <h4>{{ title }}</h4>

  <div class="chart">
    <canvas baseChart
            class="chart"
            [datasets]="bucketsChartData"
            [labels]="bucketsChartLabels"
            [chartType]="bucketsChartType"
            (chartClick)="chartClicked($event)"
            [options]="bucketsChartoptions"></canvas>
  </div>

</div>
`,
  styles: [`
.chart {
  display: block;
  height: 150px;
  width: 400px;
}
`]
})

export class BucketsChartComponent implements OnChanges {

  @Input() title: string;
  @Input() bucketsChartData: any = [];
  @Input() bucketsChartLabels: string[] = [];

  private bucketsChartType: string = 'bar';
  private bucketsChartsOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };

//  private dataPresent: boolean = false;

//  public constructor(
//  ) { }

//  ngOnInit() {
//  }

  ngOnChanges() {
    debug('BucketsChartComponent changed');
  }

  chartClicked($event) {
    console.log('chart clicked');
  }

}
