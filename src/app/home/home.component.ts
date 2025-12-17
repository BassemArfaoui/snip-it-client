import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'snip-it-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="bg-primary p-4 rounded-2xl text-black inline-block mb-4 shadow-lg">
            <span class="material-symbols-outlined text-5xl">code</span>
          </div>
          <h1 class="text-4xl font-bold text-text-main dark:text-white mb-4">Welcome to Snip-it</h1>
          <p class="text-lg text-text-muted dark:text-gray-400">Your dashboard is loading...</p>
        </div>
      </div>
    </main>
  `
})
export class HomeComponent {}
