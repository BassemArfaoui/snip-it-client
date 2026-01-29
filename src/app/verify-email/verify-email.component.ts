import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { BaseAuthComponent } from '../shared/base-auth.component';
import { CountdownService } from '../shared/countdown.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent extends BaseAuthComponent implements OnInit, OnDestroy {
  verifyForm: FormGroup;
  email = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    router: Router,
    countdownService: CountdownService
  ) {
    super(router, countdownService);
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    // Pre-fill email from localStorage if available (from signup/password change)
    const savedEmail = localStorage.getItem('pendingVerificationEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.verifyForm.patchValue({ email: savedEmail });
    }
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const { email, otp } = this.verifyForm.value;

    this.authService.verifyEmail({ email, otp }).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        localStorage.removeItem('pendingVerificationEmail');
        
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        this.handleError(err, 'Verification failed. Please check your code and try again.');
      }
    });
  }

  resendCode(): void {
    const email = this.verifyForm.get('email')?.value;
    if (!email) {
      this.error = 'Please enter your email address';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    this.authService.resendOtp(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.handleError(err, 'Failed to resend code. Please try again.');
      }
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
