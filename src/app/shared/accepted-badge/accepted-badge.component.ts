import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accepted-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-text-main dark:text-primary border border-primary">
      <span class="material-symbols-outlined text-sm filled-icon">verified</span>
      Accepted Solution
    </span>
  `,
  styles: []
})
export class AcceptedBadgeComponent {}
