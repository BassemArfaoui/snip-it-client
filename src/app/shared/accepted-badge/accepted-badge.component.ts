import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accepted-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary/20 to-primary/10 text-text-main dark:text-primary border border-primary shadow-sm">
      <span class="material-symbols-outlined text-base filled-icon text-primary">verified</span>
      Accepted Solution
    </span>
  `,
  styles: []
})
export class AcceptedBadgeComponent {}
