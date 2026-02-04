import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionDay, ProfileService } from '../../../services/profile.service';
@Component({
  selector: 'app-contribution-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contribution-graph.component.html'
})
export class ContributionGraphComponent implements OnChanges {
  @Input() visible = false;
  @Input() userId?: number;

  loading = signal(false);
  error = signal('');
  // `contributionData` is the raw days; `graphWeeks` is derived below as a computed signal

  @Output() view = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  contributionColor(count: number) {
    if (count === 0) return 'bg-gray-100 dark:bg-white/10';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900/40';
    if (count <= 4) return 'bg-green-400 dark:bg-green-800/70';
    if (count <= 6) return 'bg-green-500 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-600';
  }

  formatDate(date: string) {
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // internal contribution days (fetched when visible/userId changes)
  contributionData = signal<ContributionDay[] | null>(null);

  graphWeeks = computed(() => this.buildGraphWeeks(this.contributionData() || []));

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['userId'] && this.userId) || (changes['visible'] && this.visible)) {
      if (this.visible && this.userId) this.loadContributionData();
    }
  }

  buildGraphWeeks(data: ContributionDay[]): { date: string; count: number; }[][] {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 364);
    const counts = new Map<string, number>();
    data.forEach(entry => counts.set(entry.date.slice(0, 10), entry.count));

    const weeks: { date: string; count: number; }[][] = [];
    let currentWeek: { date: string; count: number; }[] = [];

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      currentWeek.push({ date: iso, count: counts.get(iso) || 0 });

      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length) {
      weeks.push(currentWeek);
    }

    return weeks;
  }

  loadContributionData(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.error.set('');
    this.profileService.getContributionGraph(this.userId).subscribe({
      next: (data) => {
        this.contributionData.set(data || []);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Contribution graph error:', err);
        this.contributionData.set([]);
        this.loading.set(false);
        const status = err?.status;
        if (status === 404) {
          this.error.set('User not found');
        } else {
          this.error.set(err?.error?.message || 'Failed to load contribution graph');
        }
      }
    });
  }
}
