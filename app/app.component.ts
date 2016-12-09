import { Component, OnInit } from '@angular/core';
import { RestService, SocketService } from './feathers.service';
import { AgentsService } from './agents.service';
// import { AppModule } from './app.module';

// import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';

@Component({
  selector: 'my-app',
//  templateUrl: 'app_template',
  templateUrl: 'views/app_template.html',
//  template: '<h1>Hello</h1>',
  styleUrls: ['assets/css/app.component.css']
//  providers: [ AgentsService, SocketService, RestService ]
})
export class AppComponent implements OnInit {

  title = 'Partout with Feathers';
  // agents = [];

  settings = {
    columns: {
      id: {
        title: 'ID'
      },
      name: {
        title: 'Full Name'
      },
      username: {
        title: 'User Name'
      },
      email: {
        title: 'Email'
      }
    }
  };

//  user = {email:'test'};
//  user = undefined;

  public config: any = {
    className: ['table-striped', 'table-bordered'],
    paging: true
  };

//  public columns:Array<any> = [
//    { title: 'Id', name: 'id' },
//    { title: 'IP', name: 'ip' },
//    { title: 'Environment', name: 'env' },
//    { title: 'Last Seen', name: 'lastSeen', sort: 'asc' }
//  ];
//
//  public data:Array<any> = [];
//  data: Observable<any[]>;

  private subscription: Subscription;
  private items: any[] = [];

  constructor(
    private restService: RestService,
    private socketService: SocketService,
    private agentsService: AgentsService
  ) {
//    this.data = [];
    console.log('restService:', restService);
    setTimeout(function () {
      console.log('restService user:', restService.getUser());
    }, 2000);
  }

  logout() {
    this.restService.logout();
    this.socketService.logout();
  }

  ngOnInit(): void {
    let self = this;
    console.log('app.components.ts: ngOnInit: self:', self);

//    this.agentsService.find({
//      query: {
//        // These arent yet supported by sails-arangodb, nor is pagination
//        $sort: { env: -1 },
//        $select: ['id', 'ip', 'env', 'lastSeen']
//      }
//    })
//    .toPromise()
//    .then(function (agents) {
//      console.log('agents:', agents);
//      //self.agents = agents.data;
////      self.data = agents.data.asObervable();
//      console.log('config:', self.config)
//    });

//    this.subscription = this.agentsService.items$.subscribe((items: any[]) => {
//      this.items = items;
//
//    }, (err) => {
//      console.error(err);
//    });

//    this.agentsService.find({
//      query: {
//        // These arent yet supported by sails-arangodb, nor is pagination
//        $sort: { env: -1 },
//        $select: ['id', 'ip', 'env', 'lastSeen']
//      }
//    });

  }
}
