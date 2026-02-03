import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../services/profile.service';

interface Badge { id?: number; name: string; description: string }

@Component({
  selector: 'app-badges-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badges-list.component.html'
})
export class BadgesListComponent implements OnChanges {
  @Input() badges: Badge[] = [];
  @Input() userId?: number;

  loading = false;
  error = '';

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId) {
      // only fetch if parent did not provide badges
      if (!this.badges || this.badges.length === 0) this.loadBadges();
    }
  }

  loadBadges(): void {
    if (!this.userId) return;
    this.loading = true;
    this.error = '';
    this.profileService.getBadges(this.userId).subscribe({
      next: (data) => {
        this.badges = data || [];
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('Badges error:', err);
        this.badges = [];
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load badges';
      }
    });
  }
}
