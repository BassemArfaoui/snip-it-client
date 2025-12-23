import { Directive, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { isLoggedIn } from '../auth.store';
import { CountdownService } from './countdown.service';

/**
 * Base class for auth pages to reduce duplication
 */
@Directive()
export abstract class BaseAuthComponent implements OnDestroy {
  loading = false;
  error: string | null = null;
  success = false;
  countdown = 0;

  constructor(protected router: Router, protected countdownService: CountdownService) {
    this.redirectIfLoggedIn();
  }

  /**
   * Redirect to dashboard if user is already authenticated
   */
  protected redirectIfLoggedIn(): void {
    if (isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Handle generic submission errors
   */
  protected handleError(err: any, defaultMessage: string): void {
    this.loading = false;
    this.error = err?.error?.message || defaultMessage;
  }

  /**
   * Start countdown to redirect to another page
   * @param duration - Duration in seconds (default 3)
   * @param redirectPath - Path to navigate to (default /login)
   */
  protected startCountdown(duration: number = 3, redirectPath: string = '/login'): void {
    this.countdownService.startCountdown(duration, redirectPath, (count) => {
      this.countdown = count;
    });
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.countdownService.clearCountdown();
  }
}
