import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
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

  leaderboard: any[] = [];
  loading = false;
  error = '';

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
    this.loading = true;
    this.error = '';
    this.profileService.getLeaderBoard(this.userId).subscribe({
      next: (data) => {
        this.leaderboard = data || [];
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('Leaderboard error:', err);
        this.leaderboard = [];
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load leaderboard';
      }
    });
  }
}
