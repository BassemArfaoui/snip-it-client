import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resolved-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isResolved) {
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/30 transition-colors">
        <span class="material-symbols-outlined text-sm filled-icon">check_circle</span>
        Resolved
      </span>
    } @else {
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning/10 text-warning-dark dark:text-warning border border-warning/30 transition-colors">
        <span class="material-symbols-outlined text-sm">help</span>
        Open
      </span>
    }
  `,
  styles: []
})
export class ResolvedBadgeComponent {
  @Input() isResolved: boolean = false;
}
