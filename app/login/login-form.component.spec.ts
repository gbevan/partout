/// <reference types="jasmine-jquery-matchers"/>

import { ComponentFixture,
         TestBed }      from '@angular/core/testing';
import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BrowserDynamicTestingModule,
         platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Component to test
import { LoginFormComponent } from './login-form.component';

// Dependencies for the component
import { FormsModule }        from '@angular/forms';
import { PartoutMaterialModule } from '../partout-material.module';
import { ServicesModule }       from '../services/services.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// First, initialize the Angular testing environment.
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

describe('LoginFormComponent (TestBed)', () => {
  let comp: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;

  let deH1: DebugElement;
  let elH1: HTMLElement;

  let deForm: DebugElement;
  let elForm: HTMLElement;

  let deUser: DebugElement;
  let elUser: HTMLElement;

  let dePassword: DebugElement;
  let elPassword: HTMLElement;

  let deLogin: DebugElement;
  let elLogin: HTMLElement;

  let deErrMsg: DebugElement;
  let elErrMsg: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,

        FormsModule,
        PartoutMaterialModule,
        ServicesModule
      ],
      declarations: [ LoginFormComponent ], // declare the test component
    });

    fixture = TestBed.createComponent(LoginFormComponent);

    comp = fixture.componentInstance; // LoginFormComponent test instance

    deH1 = fixture.debugElement.query(By.css('h1'));
    elH1 = deH1.nativeElement;

    deForm = fixture.debugElement.query(By.css('form'));
    elForm = deH1.nativeElement;

    deUser = fixture.debugElement.query(By.css('#user'));
    elUser = deUser.nativeElement;

    dePassword = fixture.debugElement.query(By.css('#password'));
    elPassword = dePassword.nativeElement;

    deLogin = fixture.debugElement.query(By.css('button'));
    elLogin = deLogin.nativeElement;

  });

  describe('title', () => {
    it('should show correct title', () => {
      fixture.detectChanges();
      expect(elH1.textContent).toContain('Partout');
    });
  });

  describe('login form', () => {

    describe('user name field', () => {
      it('should be defined', () => {
        expect(elUser).toBeDefined();
      });
      it('should have property placeholder', () => {
        expect(elUser).toHaveProp('placeholder', 'Enter User Name');
      });
      it('should have property name', () => {
        expect(elUser).toHaveProp('name', 'user');
      });
      it('should have property autofocus', () => {
        expect(elUser).toHaveProp('autofocus');
      });
      it('should have property required', () => {
        expect(elUser).toHaveProp('required');
      });
      it('should have property type of text', () => {
        expect(elUser).toHaveProp('type', 'text');
      });
    });

    describe('password field', () => {
      it('should be defined', () => {
        expect(elPassword).toBeDefined();
      });
      it('should have property placeholder', () => {
        expect(elPassword).toHaveProp('placeholder', 'Enter Password');
      });
      it('should have property name', () => {
        expect(elPassword).toHaveProp('name', 'password');
      });
      it('should have property required', () => {
        expect(elUser).toHaveProp('required');
      });
      it('should have property type of password', () => {
        expect(elPassword).toHaveProp('type', 'password');
      });
    });

    describe('login button', () => {
      it('should be defined', () => {
        expect(elLogin).toBeDefined();
      });
      it('should have property type of submit', () => {
        expect(elLogin).toHaveProp('type', 'submit');
      });
    });

    describe('error message field', () => {
      it('should initially not be defined', () => {
        deErrMsg = fixture.debugElement.query(By.css('div.errormsg'));
        expect(deErrMsg).toBeNull();
      });

      it('should be defined if errorMsg is set', () => {
        comp._setErrorMsg('ERROR');
        fixture.detectChanges();
        deErrMsg = fixture.debugElement.query(By.css('div.errormsg'));
        expect(deErrMsg).not.toBeNull();

        elErrMsg = deErrMsg.nativeElement;
        expect(elErrMsg.textContent).toContain('ERROR');
      });
    });

  });

});
