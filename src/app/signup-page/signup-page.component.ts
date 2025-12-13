import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { login } from '../auth.store';

@Component({
  selector: 'snip-it-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent {
  profile = signal({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  acceptTerms = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  showOtpVerification = signal(false);
  otp = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  get name(): string {
    return this.profile().name;
  }
  set name(value: string) {
    this.profile.update((current) => ({ ...current, name: value }));
  }

  get email(): string {
    return this.profile().email;
  }
  set email(value: string) {
    this.profile.update((current) => ({ ...current, email: value }));
  }

  get password(): string {
    return this.profile().password;
  }
  set password(value: string) {
    this.profile.update((current) => ({ ...current, password: value }));
  }

  get confirm(): string {
    return this.profile().confirm;
  }
  set confirm(value: string) {
    this.profile.update((current) => ({ ...current, confirm: value }));
  }

  get termsAccepted(): boolean {
    return this.acceptTerms();
  }
  set termsAccepted(value: boolean) {
    this.acceptTerms.set(value);
  }

  onSubmit(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const prof = this.profile();
    this.authService.register({
      email: prof.email,
      username: prof.email.split('@')[0], // Use part of email as username if not provided
      password: prof.password,
      fullName: prof.name
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.showOtpVerification.set(true); // Show OTP verification form
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  onVerifyOtp(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const prof = this.profile();
    this.authService.verifyEmail({
      email: prof.email,
      otp: this.otp()
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        login(); // Update auth store to logged in
        this.router.navigate(['/dashboard']); // Redirect to dashboard or home
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'OTP verification failed. Please try again.');
      }
    });
  }

  onResendOtp(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const prof = this.profile();
    this.authService.resendOtp(prof.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to resend OTP.');
      }
    });
  }
}
