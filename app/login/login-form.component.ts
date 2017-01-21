import { Component, OnInit } from '@angular/core';
import { RestService, SocketService } from '../feathers/feathers.service';
//import { Subscription } from 'rxjs';

const html = require('./login_form_template.html');
const css = require('./login-form.component.css');

@Component({
  selector: 'login-form',
  template: html,
  styles: [css]
})
export class LoginFormComponent implements OnInit {
  user = '';
  password = '';
  errorMsg = '';
  loginFailedMsg = 'Login failed, check your details and try again.';

  constructor(private restService: RestService, private socketService: SocketService) {
    this.restService = restService;
  }

  login(form: any) {
    this.errorMsg = '';

    // Login Rest Service
    this.restService.login(form.user, form.password)
//    .then((result) => {
//      this.stateRest = result;
//    })
    .catch((err) => {
      if (err.code) {
        this.errorMsg = err.code + ' - ' + this.loginFailedMsg;
      } else {
        this.errorMsg = err;
      }
    });

    // Login Socket Service
    this.socketService.login(form.user, form.password)
//    .then((result) => {
//      this.stateSock = result;
//    })
    .catch((err) => {
      if (err.code) {
        this.errorMsg = err.code + ' - ' + this.loginFailedMsg;
      } else {
        this.errorMsg = err;
      }
    });
  }

  ngOnInit(): void {
    document.getElementById('user').focus();
  }
}
