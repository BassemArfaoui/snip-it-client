import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { login, isLoggedIn } from '../auth.store';

/**
 * Custom validator: passwords must match
 */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirm');

  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'snip-it-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent implements OnInit {
  signupForm!: FormGroup;
  otpForm!: FormGroup;
  loading = false;
  error: string | null = null;
  showOtpVerification = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect to dashboard if already logged in
    if (isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

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
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
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
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'OTP verification failed. Please try again.';
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
        this.loading = false;
        this.error = err.error?.message || 'Failed to resend OTP.';
      }
    });
  }
}
