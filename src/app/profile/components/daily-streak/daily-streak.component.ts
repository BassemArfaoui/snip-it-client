import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
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

  streak = signal<any | null>(null);
  loading = signal(false);
  error = signal('');

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
    this.loading.set(true);
    this.error.set('');
    this.profileService.getStreak(this.userId).subscribe({
      next: (data) => {
        this.streak.set(data);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Daily streak error:', err);
        this.streak.set(null);
        this.loading.set(false);
        const status = err?.status;
        if (status === 404) this.error.set('User not found');
        else this.error.set(err?.error?.message || 'Failed to load streak data');
      }
    });
  }

  formatDate(date: string) {
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
