import { inject, fakeAsync, tick, TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement }    from '@angular/core';
import { By }              from '@angular/platform-browser';

import { MockBackend } from '@angular/http/testing';
import { Http, ConnectionBackend, BaseRequestOptions, Response, ResponseOptions } from '@angular/http';

import { LoginFormComponent } from 'app/login/login-form.component';

//describe('App Component', function () {
//  it('test', function () {
//    expect(true).toEqual(true);
//  });
//
//  it('test2', function () {
//    expect(true).toEqual(true);
//  });
//});

describe('Login Form Component', () => {
  let comp: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    console.log('beforeEach');
    TestBed.configureTestingModule({
      declarations: [ LoginFormComponent ]
    });

    console.log('before fixture');
    fixture = TestBed.createComponent(LoginFormComponent);

    console.log('before comp');
    comp = fixture.componentInstance;
  });

  it('should have user name input field', () => {
    de = fixture.debugElement.query(By.css('#user'));
    console.log('de:', de);
    el = de.nativeElement;
    console.log('el:', el);
  });

});
