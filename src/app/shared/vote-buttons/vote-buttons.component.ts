import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vote-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3">
      <!-- Like Button -->
      <button
        (click)="onLike()"
        [disabled]="disabled"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        [class.text-success]="userVote === 'LIKE'"
        [class.bg-success-light]="userVote === 'LIKE'">
        <span class="material-symbols-outlined text-lg" [class.filled-icon]="userVote === 'LIKE'">
          thumb_up
        </span>
        <span class="text-sm font-medium">{{ likesCount }}</span>
      </button>

      <!-- Dislike Button -->
      <button
        (click)="onDislike()"
        [disabled]="disabled"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        [class.text-danger]="userVote === 'DISLIKE'"
        [class.bg-danger-light]="userVote === 'DISLIKE'">
        <span class="material-symbols-outlined text-lg" [class.filled-icon]="userVote === 'DISLIKE'">
          thumb_down
        </span>
        <span class="text-sm font-medium">{{ dislikesCount }}</span>
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
