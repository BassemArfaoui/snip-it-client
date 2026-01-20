import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-language-badge',
  standalone: true,
  template: `
    <span [class]="getBadgeClasses()">
      {{ language }}
    </span>
  `,
  styles: []
})
export class LanguageBadgeComponent {
  @Input() language: string = '';

  getBadgeClasses(): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colorMap: { [key: string]: string } = {
      'typescript': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'javascript': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'python': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'java': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'csharp': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'go': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'rust': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'php': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'ruby': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'cpp': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };
    
    const colorClass = colorMap[this.language.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    return `${baseClasses} ${colorClass}`;
  }
}
