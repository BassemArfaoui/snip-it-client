import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
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

  // Local reactive state
  badgesSignal = signal<Badge[]>(this.badges || []);
  loading = signal(false);
  error = signal('');

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['badges']) {
      this.badgesSignal.set(this.badges || []);
    }
    if (changes['userId'] && this.userId) {
      // only fetch if parent did not provide badges
      if (!this.badges || this.badges.length === 0) this.loadBadges();
    }
  }

  loadBadges(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.error.set('');
    this.profileService.getBadges(this.userId).subscribe({
      next: (data) => {
        this.badgesSignal.set(data || []);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Badges error:', err);
        this.badgesSignal.set([]);
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to load badges');
      }
    });
  }
}
