import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="onCancel()"></div>

        <!-- Dialog -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100 dark:border-white/10 animate-slide-up">
            <!-- Icon -->
            <div class="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-danger/10">
              <span class="material-symbols-outlined text-danger text-3xl">
                warning
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-xl font-bold text-center text-text-main dark:text-white mb-2">
              {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-center text-text-muted dark:text-gray-400 mb-6 leading-relaxed">
              {{ message }}
            </p>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                (click)="onCancel()"
                class="flex-1 px-4 py-3 rounded-xl font-semibold transition-all bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main dark:text-white hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                (click)="onConfirm()"
                class="flex-1 px-4 py-3 rounded-xl font-semibold transition-all bg-danger hover:bg-danger-dark text-white shadow-lg shadow-danger/30 hover:shadow-xl hover:shadow-danger/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class ConfirmDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Are you sure?';
  @Input() message: string = 'This action cannot be undone.';
  @Input() confirmText: string = 'Confirm';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
