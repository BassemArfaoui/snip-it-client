import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { login, username } from '../auth.store';
import { AuthService } from '../auth.service';
import { BaseAuthComponent } from '../shared/base-auth.component';
import { CountdownService } from '../shared/countdown.service';

@Component({
  selector: 'snip-it-github-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './github-callback.component.html',
  styleUrls: ['./github-callback.component.css']
})
export class GitHubCallbackComponent extends BaseAuthComponent implements OnInit, OnDestroy {
  override loading = true;

  constructor(
    private route: ActivatedRoute,
    router: Router,
    private authService: AuthService,
    countdownService: CountdownService
  ) {
    super(router, countdownService);
  }

  ngOnInit(): void {
    // Extract tokens from query params or cookies
    const qp = this.route.snapshot.queryParamMap;
    const accessToken = qp.get('accessToken') || this.getCookie('accessToken');
    const refreshToken = qp.get('refreshToken') || this.getCookie('refreshToken');
    const errorParam = qp.get('error');

    if (errorParam) {
      this.loading = false;
      this.error = `GitHub authentication failed: ${errorParam}`;
      this.startCountdown(3, '/login');
      return;
    }

    if (!accessToken || !refreshToken) {
      this.loading = false;
      this.error = 'Missing authentication tokens. Please try again.';
      this.startCountdown(3, '/login');
      return;
    }

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update auth state and extract username from token
    login();
    const user = this.authService.getUsername();
    username.set(user);

    // Redirect to feed
    this.loading = false;
    this.router.navigate(['/']);
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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
