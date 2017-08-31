import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/services.module';

// import { Subscription } from 'rxjs';

const html = require('./login_form_template.html');
const css = require('./login-form.component.css');

const debug = require('debug').debug('partout:component:login-form');

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

  constructor(private socketService: SocketService) { }

  login(form: any) {
    this.errorMsg = '';

    // Login via Socket Service
    this.socketService.login(form.user, form.password)
    .catch((err) => {
//      if (err.code) {
//        this.errorMsg = err.code + ' - ' + this.loginFailedMsg;
//      } else {
//        this.errorMsg = err;
//      }
      this.errorMsg = err.code ? err.code + ' - ' + this.loginFailedMsg : err;
    });
  }

  ngOnInit(): void {
    document.getElementById('user').focus();
  }
}
