import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {

  let loginForm: LoginFormComponent;
  beforeAll(() => {
    // TODO: mock up SocketService for login
    loginForm = new LoginFormComponent(null);
  });

  it ('should be defined', () => {
    expect(loginForm).toBeDefined();
  });

  it('should have a login method', () => {
    expect(loginForm.login).toBeDefined();
  });
});
