import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { isLoggedIn } from '../auth.store';

@Component({
  selector: 'snip-it-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  emailForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  countdown = 3;
  private countdownInterval: any;

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

    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.emailForm.get('email');
  }

  onSubmit(): void {
    if (!this.emailForm.valid || this.loading) return;

    this.loading = true;
    this.error = null;

    const { email } = this.emailForm.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        // Start countdown and redirect to login after 3 seconds
        this.startCountdown();
      },
      error: (err) => {
        this.loading = false;
        // Server doesn't reveal if email exists (security)
        // Show same generic message on error to maintain security
        this.success = true;
        this.startCountdown();
      }
    });
  }

  private startCountdown(): void {
    this.countdown = 3;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
