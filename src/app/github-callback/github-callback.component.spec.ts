import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { GitHubCallbackComponent } from './github-callback.component';
import { AuthService } from '../auth.service';

const activatedRouteMock = {
  snapshot: {
    queryParamMap: convertToParamMap({
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    })
  }
};

describe('GitHubCallbackComponent', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getUsername']);
    authServiceMock.getUsername.and.returnValue('tester');

    await TestBed.configureTestingModule({
      imports: [GitHubCallbackComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GitHubCallbackComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
