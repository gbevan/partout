import { Component, OnInit } from '@angular/core';

import { RestService, SocketService } from './feathers.service';

// import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';

@Component({
  selector: 'login-form',
  templateUrl: 'views/login_form_template.html',
  styleUrls: ['assets/css/login-form.component.css']
//  providers: [ AgentsService, SocketService, RestService ]
})
export class LoginFormComponent implements OnInit {
  // TODO: Remove these test details
  email = 'admin@feathersjs.com';
  password = 'admin';
  stateRest = '';
  stateSock = '';
  errorMsg = '';
  loginFailedMsg = 'Login failed, check your details and try again.'

  constructor(private restService: RestService, private socketService: SocketService) {
    this.restService = restService;
  }

  login() {
    console.log('login() from login');
    this.errorMsg = '';

    // Login Rest Service
    this.restService.login(this.email, this.password)
    .then((result) => {
      this.stateRest = result;
    })
    .catch((err) => {
      this.stateRest = err;
      this.errorMsg = err.code + ' - ' + this.loginFailedMsg;
    });

    // Login Socket Service
    this.socketService.login(this.email, this.password)
    .then((result) => {
      this.stateSock = result;
    })
    .catch((err) => {
      this.stateSock = err;
      this.errorMsg = err.code + ' - ' + this.loginFailedMsg;
    })
  }

  ngOnInit(): void {
    let self = this;
    console.log('login-form.components.ts: ngOnInit: self:', self);

  }
}
