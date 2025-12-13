import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { login } from '../auth.store';

@Component({
  selector: 'snip-it-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  credentials = signal({
    email: '',
    password: ''
  });

  remember = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  get email(): string {
    return this.credentials().email;
  }
  set email(value: string) {
    this.credentials.update(c => ({ ...c, email: value }));
  }

  get password(): string {
    return this.credentials().password;
  }
  set password(value: string) {
    this.credentials.update(c => ({ ...c, password: value }));
  }

  onSubmit(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const creds = this.credentials();
    this.authService.login({
      identifier: creds.email,
      password: creds.password
    }).subscribe({
      next: (tokens) => {
        this.loading.set(false);
        login(); // Update auth store
        this.router.navigate(['/dashboard']); // Navigate to dashboard or home
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }
}
