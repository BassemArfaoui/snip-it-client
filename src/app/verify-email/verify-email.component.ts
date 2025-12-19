import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  verifyForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  email = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
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
    this.success = '';

    const { email, otp } = this.verifyForm.value;

    this.authService.verifyEmail({ email, otp }).subscribe({
      next: (response) => {
        this.success = response.message || 'Email verified successfully!';
        this.loading = false;
        localStorage.removeItem('pendingVerificationEmail');
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Verification failed. Please check your code and try again.';
        this.loading = false;
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
    this.success = '';

    this.authService.resendOtp(email).subscribe({
      next: (response) => {
        this.success = response.message || 'Verification code sent to your email!';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to resend code. Please try again.';
        this.loading = false;
      }
    });
  }
}
