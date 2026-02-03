import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-global-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-leaderboard.component.html'
})
export class GlobalLeaderboardComponent {
  @Input() visible = false;
  @Input() userId?: number;

  leaderboard = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  @Output() view = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();
  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['visible'] && this.visible) || changes['userId']) {
      if (this.visible) this.loadLeaderboard();
    }
  }

  loadLeaderboard(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.error.set('');
    this.profileService.getLeaderBoard(this.userId).subscribe({
      next: (data) => {
        this.leaderboard.set(data || []);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Leaderboard error:', err);
        this.leaderboard.set([]);
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to load leaderboard');
      }
    });
  }
}
