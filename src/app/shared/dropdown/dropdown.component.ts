import { Component, Input, Output, EventEmitter, ElementRef, HostListener, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggleDropdown(); $event.stopPropagation()"
        [ngClass]="{'ring-2 ring-primary/50': isOpen}"
        class="flex items-center justify-between gap-3 min-w-[160px] pl-4 pr-3 py-2.5 rounded-xl border-0 bg-white dark:bg-card-dark text-text-main dark:text-white shadow-soft hover:shadow-md focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer text-sm font-medium">
        <span class="truncate">{{ getSelectedLabel() }}</span>
        <span class="material-symbols-outlined text-lg text-text-muted transition-transform duration-200" [ngClass]="{'rotate-180': isOpen}">expand_more</span>
      </button>
      <div
        *ngIf="isOpen"
        class="absolute top-full left-0 mt-2 min-w-full w-max max-h-64 overflow-y-auto bg-white dark:bg-card-dark rounded-xl shadow-lg border border-gray-100 dark:border-white/10 z-50 animate-fade-in">
        <button
          *ngFor="let option of options"
          type="button"
          (click)="selectOption(option)"
          class="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl"
          [ngClass]="{
            'bg-primary/10 text-primary': option.value === value,
            'text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5': option.value !== value
          }">
          <div class="flex items-center justify-between gap-3">
            <span>{{ option.label }}</span>
            <span *ngIf="option.value === value" class="material-symbols-outlined text-primary text-lg">check</span>
          </div>
        </button>
      </div>
    </div>
  `
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Select...';
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.onTouched();
  }

  selectOption(option: DropdownOption) {
    this.value = option.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.isOpen = false;
  }

  getSelectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label : this.placeholder;
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
