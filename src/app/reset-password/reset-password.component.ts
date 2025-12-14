import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { isLoggedIn } from '../auth.store';

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
  selector: 'snip-it-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  private linkEmail: string | null = null;
  private linkToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Redirect to dashboard if already logged in
    if (isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', [Validators.required, Validators.minLength(8)]]
      },
      { validators: passwordMatchValidator }
    );

    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const token = qp.get('token');

    if (!email || !token) {
      this.error = 'This reset link is invalid or missing required parameters. Please request a new link.';
      this.resetForm.disable();
      return;
    }

    this.linkEmail = email;
    this.linkToken = token;
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirm() {
    return this.resetForm.get('confirm');
  }

  onSubmit(): void {
    if (!this.resetForm.valid || this.loading || this.resetForm.disabled) return;

    this.loading = true;
    this.error = null;

    const { password } = this.resetForm.getRawValue();

    if (!this.linkEmail || !this.linkToken) {
      this.error = 'This reset link is invalid or expired. Please request a new link.';
      this.loading = false;
      return;
    }

    this.authService.resetPassword({
      email: this.linkEmail,
      token: this.linkToken,
      newPassword: password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Password reset failed. Please check your details and try again.';
      }
    });
  }

  onLoginRedirect(): void {
    this.router.navigate(['/login']);
  }
}
