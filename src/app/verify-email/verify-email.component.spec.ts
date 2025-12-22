import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../auth.service';

describe('VerifyEmailComponent', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['verifyEmail', 'resendOtp']);
    authServiceMock.verifyEmail.and.returnValue(of({ data: { message: 'ok' }, message: 'ok' } as any));
    authServiceMock.resendOtp.and.returnValue(of({ message: 'ok' } as any));

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(VerifyEmailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
