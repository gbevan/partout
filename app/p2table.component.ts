import { Component, Input, OnInit } from '@angular/core';
//import { PaginationModule } from 'ng2-bootstrap/ng2-bootstrap';

// import { AppModule } from './app.module';

@Component({
  selector: 'p2-table',
  templateUrl: 'p2table_template',
  styleUrls: ['assets/css/p2table.component.css']
})

export class P2TableComponent implements OnInit {

  @Input() data: Array<any>;

  public columns:Array<any> = [
    { title: 'Id', name: 'id' },
    { title: 'IP', name: 'ip' },
    { title: 'Environment', name: 'env' },
    { title: 'Last Seen', name: 'lastSeen', sort: 'asc' }
  ];
  public rows:Array<any> = [];

  public page:number = 1;
  public itemsPerPage:number = 7;
  public maxSize:number = 5;
  public numPages:number = 1;
  public length:number = 0;

  public config:any = {
    className: ['table-striped', 'table-bordered'],
    paging: true,
    sorting: { columns: this.columns }
  }


  public constructor() {
    console.log('constructor data:', this.data);
//    this.length = this.data.length;
  }

  ngOnInit(): void {
    console.log('ngOnInit data:', this.data);
    this.onChangeTable(this.config);
  }

  public changePage(page:any, data:Array<any> = this.data):Array<any> {
    console.log('changePage data:', this.data);
    console.log(page);
    let start = (page.page - 1) * page.itemsPerPage;
    let end = page.itemsPerPage > -1 ? (start + page.itemsPerPage) : data.length;
    return data.slice(start, end);
  }

  public changeSort(data:any, config:any):any {
    console.log('changeSort data:', this.data);
    if (!config.sorting) {
      return data;
    }

    let columns = this.config.sorting.columns || [];
    let columnName:string = void 0;
    let sort:string = void 0;

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].sort !== '') {
        columnName = columns[i].name;
        sort = columns[i].sort;
      }
    }

    if (!columnName) {
      return data;
    }

    // simple sorting
    return data.sort((previous:any, current:any) => {
      if (previous[columnName] > current[columnName]) {
        return sort === 'desc' ? -1 : 1;
      } else if (previous[columnName] < current[columnName]) {
        return sort === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }

  public changeFilter(data:any, config:any):any {
    console.log('changeFilter data:', this.data);
    if (!config.filtering) {
      return data;
    }

    let filteredData:Array<any> = data.filter((item:any) =>
      item[config.filtering.columnName].match(this.config.filtering.filterString));

    return filteredData;
  }

  public onChangeTable(config:any, page:any = {page: this.page, itemsPerPage: this.itemsPerPage}):any {
    console.log('onChangeTable data:', this.data);
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }
    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }

    let filteredData = this.changeFilter(this.data, this.config);
    let sortedData = this.changeSort(filteredData, this.config);
    this.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
    this.length = sortedData.length;
  }
}
