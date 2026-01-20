import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vote-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <!-- Like Button -->
      <button
        (click)="onLike()"
        [disabled]="disabled"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        [ngClass]="{
          'bg-success/10 text-success border border-success/30': userVote === 'LIKE',
          'hover:bg-success/5 text-text-muted dark:text-gray-400 hover:text-success border border-transparent hover:border-success/20': userVote !== 'LIKE'
        }">
        <span
          class="material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          [class.filled-icon]="userVote === 'LIKE'">
          thumb_up
        </span>
        <span class="text-sm font-semibold tabular-nums">{{ likesCount }}</span>
      </button>

      <!-- Dislike Button -->
      <button
        (click)="onDislike()"
        [disabled]="disabled"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        [ngClass]="{
          'bg-danger/10 text-danger border border-danger/30': userVote === 'DISLIKE',
          'hover:bg-danger/5 text-text-muted dark:text-gray-400 hover:text-danger border border-transparent hover:border-danger/20': userVote !== 'DISLIKE'
        }">
        <span
          class="material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          [class.filled-icon]="userVote === 'DISLIKE'">
          thumb_down
        </span>
        <span class="text-sm font-semibold tabular-nums">{{ dislikesCount }}</span>
      </button>
    </div>
  `,
  styles: []
})
export class VoteButtonsComponent {
  @Input() likesCount: number = 0;
  @Input() dislikesCount: number = 0;
  @Input() userVote: 'LIKE' | 'DISLIKE' | null = null;
  @Input() disabled: boolean = false;

  @Output() vote = new EventEmitter<'LIKE' | 'DISLIKE'>();

  onLike() {
    this.vote.emit('LIKE');
  }

  onDislike() {
    this.vote.emit('DISLIKE');
  }
}
