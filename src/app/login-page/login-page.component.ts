import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { login, isLoggedIn } from '../auth.store';

@Component({
  selector: 'snip-it-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  sessionExpired = false;
  redirectUrl: string | null = null;
  // `remember` removed: this option was UI-only and caused invalid payloads.

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize form first (before any async operations)
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Redirect to dashboard if already logged in
    if (isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get the redirect URL from localStorage
    this.redirectUrl = localStorage.getItem('redirectUrl');

    // Check if redirected due to token expiration
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        this.sessionExpired = true;
        this.error = 'Your session has expired. Please log in again.';
      }
    });
  }

  get identifier() {
    return this.loginForm.get('identifier');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (!this.loginForm.valid || this.loading) return;

    this.loading = true;
    this.error = null;

    const formData = this.loginForm.value;
    // Only send identifier and password to API, keep remember local
    this.authService.login({
      identifier: formData.identifier,
      password: formData.password
    }).subscribe({
      next: (tokens) => {
        this.loading = false;
        login();
        
        // Redirect to the original URL if available
        const redirectTo = this.redirectUrl || '/dashboard';
        if (this.redirectUrl) {
          localStorage.removeItem('redirectUrl');
        }
        this.router.navigateByUrl(redirectTo);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
