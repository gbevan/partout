import { inject, fakeAsync, tick, TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MockBackend } from '@angular/http/testing';
import { Http, ConnectionBackend, BaseRequestOptions, Response, ResponseOptions } from '@angular/http';

import { LoginFormComponent } from '../../app/login/login-form.component';

describe('Login Form Component', () => {
  let comp: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach((done: Function) => {
    console.log('beforeEach');

    try {
      TestBed.configureTestingModule({
        declarations: [ LoginFormComponent ]
      });

      console.log('before fixture - LoginFormComponent:', LoginFormComponent);
      fixture = TestBed.createComponent(LoginFormComponent);

      console.log('before comp');
      comp = fixture.componentInstance;

      console.log('*********************** done');
      done();
    } catch (e) {
      console.log('beforeEach err:', e);
      done(e);
    }
  });

  describe('input fields', () => {
    it('should have user name input field', () => {
      console.log('fixture:', fixture);
      console.log('comp:', comp);
      de = fixture.debugElement.query(By.css('#user'));
      console.log('de:', de);
      el = de.nativeElement;
      console.log('el:', el);
    });
  });

});
