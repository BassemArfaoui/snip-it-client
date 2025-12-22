import { Router } from '@angular/router';
import { isLoggedIn } from './auth.store';

/**
 * Base class for auth pages to reduce duplication
 */
export abstract class BaseAuthComponent {
  loading = false;
  error: string | null = null;

  constructor(protected router: Router) {
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
   */
  protected createCountdown(
    duration: number,
    redirectPath: string,
    onCountdownChange?: (count: number) => void
  ): NodeJS.Timeout {
    let countdown = duration;
    const interval = setInterval(() => {
      countdown--;
      onCountdownChange?.(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        this.router.navigate([redirectPath]);
      }
    }, 1000);
    return interval;
  }
}
