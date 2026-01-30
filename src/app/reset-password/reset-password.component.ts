import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { BaseAuthComponent } from '../shared/base-auth.component';
import { passwordMatchValidator } from '../shared/validators';
import { CountdownService } from '../shared/countdown.service';

@Component({
  selector: 'snip-it-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent extends BaseAuthComponent implements OnInit, OnDestroy {
  resetForm!: FormGroup;
  private linkEmail: string | null = null;
  private linkToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    router: Router,
    private route: ActivatedRoute,
    countdownService: CountdownService
  ) {
    super(router, countdownService);
  }

  ngOnInit(): void {
    this.redirectIfLoggedIn();

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

    console.log('[ResetPassword] Query params - email:', email, 'token:', token);

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
    console.log('[ResetPassword] onSubmit called');
    console.log('[ResetPassword] Form valid:', this.resetForm.valid, 'disabled:', this.resetForm.disabled, 'loading:', this.loading);
    
    if (!this.resetForm.valid || this.loading || this.resetForm.disabled) {
      console.log('[ResetPassword] Form blocked - exiting');
      return;
    }

    this.loading = true;
    this.error = null;

    const { password } = this.resetForm.getRawValue();

    if (!this.linkEmail || !this.linkToken) {
      console.log('[ResetPassword] Missing email/token');
      this.error = 'This reset link is invalid or expired. Please request a new link.';
      this.loading = false;
      return;
    }

    console.log('[ResetPassword] Calling API with email:', this.linkEmail);
    
    this.authService.resetPassword({
      email: this.linkEmail,
      token: this.linkToken,
      newPassword: password
    }).subscribe({
      next: (res) => {
        console.log('[ResetPassword] Success:', res);
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        console.error('[ResetPassword] Error:', err);
        this.handleError(err, 'Password reset failed. Please check your details and try again.');
      }
    });
  }

  onLoginRedirect(): void {
    this.router.navigate(['/login']);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
