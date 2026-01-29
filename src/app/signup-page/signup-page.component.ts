import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { login } from '../auth.store';
import { BaseAuthComponent } from '../shared/base-auth.component';
import { passwordMatchValidator } from '../shared/validators';
import { CountdownService } from '../shared/countdown.service';

@Component({
  selector: 'snip-it-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent extends BaseAuthComponent implements OnInit, OnDestroy {
  signupForm!: FormGroup;
  otpForm!: FormGroup;
  showOtpVerification = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    router: Router,
    countdownService: CountdownService
  ) {
    super(router, countdownService);
  }

  ngOnInit(): void {
    this.redirectIfLoggedIn();

    this.signupForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', [Validators.required, Validators.minLength(8)]],
        terms: [false, [Validators.requiredTrue]]
      },
      { validators: passwordMatchValidator }
    );

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  get fullName() {
    return this.signupForm.get('fullName');
  }

  get username() {
    return this.signupForm.get('username');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirm() {
    return this.signupForm.get('confirm');
  }

  get terms() {
    return this.signupForm.get('terms');
  }

  get otp() {
    return this.otpForm.get('otp');
  }

  onSubmit(): void {
    if (!this.signupForm.valid || this.loading) return;

    this.loading = true;
    this.error = null;

    const formVal = this.signupForm.value;
    this.userEmail = formVal.email;

    this.authService.register({
      email: formVal.email,
      username: formVal.username,
      password: formVal.password,
      fullName: formVal.fullName
    }).subscribe({
      next: () => {
        this.loading = false;
        this.showOtpVerification = true;
      },
      error: (err) => {
        this.handleError(err, 'Registration failed. Please try again.');
      }
    });
  }

  onVerifyOtp(): void {
    if (!this.otpForm.valid || this.loading) return;

    this.loading = true;
    this.error = null;

    this.authService.verifyEmail({
      email: this.userEmail,
      otp: this.otpForm.get('otp')!.value
    }).subscribe({
      next: () => {
        this.loading = false;
        login();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.handleError(err, 'OTP verification failed. Please try again.');
      }
    });
  }

  onResendOtp(): void {
    if (this.loading) return;

    this.loading = true;
    this.error = null;

    this.authService.resendOtp(this.userEmail).subscribe({
      next: () => {
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.handleError(err, 'Failed to resend OTP.');
      }
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
