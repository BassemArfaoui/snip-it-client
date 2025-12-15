import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { login, username } from '../auth.store';
import { AuthService } from '../auth.service';

@Component({
  selector: 'snip-it-github-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './github-callback.component.html',
  styleUrls: ['./github-callback.component.css']
})
export class GitHubCallbackComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  countdown = 3;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Extract tokens from query params or cookies
    const qp = this.route.snapshot.queryParamMap;
    const accessToken = qp.get('accessToken') || this.getCookie('accessToken');
    const refreshToken = qp.get('refreshToken') || this.getCookie('refreshToken');
    const errorParam = qp.get('error');

    if (errorParam) {
      this.loading = false;
      this.error = `GitHub authentication failed: ${errorParam}`;
      this.redirectAfterDelay();
      return;
    }

    if (!accessToken || !refreshToken) {
      this.loading = false;
      this.error = 'Missing authentication tokens. Please try again.';
      this.redirectAfterDelay();
      return;
    }

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update auth state and extract username from token
    login();
    const user = this.authService.getUsername();
    username.set(user);

    // Redirect to dashboard
    this.loading = false;
    this.router.navigate(['/dashboard']);
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  private redirectAfterDelay(): void {
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
