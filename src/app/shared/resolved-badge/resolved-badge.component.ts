import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resolved-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isResolved) {
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success-dark dark:bg-success-dark/30 dark:text-success-light">
        <span class="material-symbols-outlined text-sm">check_circle</span>
        Resolved
      </span>
    } @else {
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning-dark dark:bg-warning-dark/30 dark:text-warning-light">
        <span class="material-symbols-outlined text-sm">pending</span>
        Unresolved
      </span>
    }
  `,
  styles: []
})
export class ResolvedBadgeComponent {
  @Input() isResolved: boolean = false;
}
