import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Service to manage countdown timers for redirects
 */
@Injectable({
  providedIn: 'root'
})
export class CountdownService {
  private countdownInterval: any = null;

  constructor(private router: Router) {}

  /**
   * Start a countdown timer that redirects to a path when complete
   * @param duration - Duration in seconds
   * @param redirectPath - Path to navigate to after countdown
   * @param onTick - Optional callback fired each second with remaining count
   */
  startCountdown(
    duration: number,
    redirectPath: string,
    onTick?: (remaining: number) => void
  ): void {
    this.clearCountdown();

    let countdown = duration;
    onTick?.(countdown);

    this.countdownInterval = setInterval(() => {
      countdown--;
      onTick?.(countdown);
      if (countdown <= 0) {
        this.clearCountdown();
        this.router.navigate([redirectPath]);
      }
    }, 1000);
  }

  /**
   * Clear any active countdown
   */
  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
