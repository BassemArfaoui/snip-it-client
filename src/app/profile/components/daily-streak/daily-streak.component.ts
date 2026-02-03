import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-daily-streak',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-streak.component.html'
})
export class DailyStreakComponent implements OnChanges {
  @Input() visible = false;
  @Input() userId?: number;

  streak: any = null;
  loading = false;
  error = '';

  @Output() view = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['visible'] && this.visible) || changes['userId']) {
      if (this.visible && this.userId) this.loadStreak();
    }
  }

  loadStreak(): void {
    if (!this.userId) return;
    this.loading = true;
    this.error = '';
    this.profileService.getStreak(this.userId).subscribe({
      next: (data) => {
        this.streak = data;
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('Daily streak error:', err);
        this.streak = null;
        this.loading = false;
        const status = err?.status;
        if (status === 404) this.error = 'User not found';
        else this.error = err?.error?.message || 'Failed to load streak data';
      }
    });
  }

  formatDate(date: string) {
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
