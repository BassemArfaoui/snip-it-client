import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrivateSnippetsService, PrivateSnippet, CreateSnippetDto } from '../../services/private-snippets.service';

@Component({
  selector: 'app-snippets-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './snippets-list.component.html',
  styleUrls: ['./snippets-list.component.css']
})
export class SnippetsListComponent {
  private snippetsService = inject(PrivateSnippetsService);
  private router = inject(Router);

  // Signals
  snippets = signal<PrivateSnippet[]>([]);
  filteredSnippets = signal<PrivateSnippet[]>([]);
  loading = signal(false);
  error = signal('');
  
  // Filter states
  searchQuery = signal('');
  selectedLanguage = signal('All');
  selectedTags = signal<string[]>([]);
  sortBy = signal('Newest First');
  
  // Create snippet modal
  showCreateModal = signal(false);
  newSnippet = signal<CreateSnippetDto>({
    title: '',
    content: '',
    language: 'javascript'
  });
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalSnippets = signal(0);

  languages = ['All', 'javascript', 'typescript', 'python', 'java', 'css', 'html', 'go', 'rust', 'php'];

  // Computed signals
  hasMoreSnippets = computed(() => this.totalSnippets() > this.filteredSnippets().length);
  isEmptyState = computed(() => !this.loading() && this.filteredSnippets().length === 0);
  hasError = computed(() => this.error().length > 0);

  constructor() {
    effect(() => {
      this.loadSnippets();
    });
  }

  loadSnippets(): void {
    this.loading.set(true);
    this.error.set('');
    
    this.snippetsService.getSnippets({
      page: this.currentPage(),
      size: this.pageSize(),
      q: this.searchQuery() || undefined,
      language: this.selectedLanguage() !== 'All' ? this.selectedLanguage().toLowerCase() : undefined,
      tags: this.selectedTags().length > 0 ? this.selectedTags() : undefined
    }).subscribe({
      next: (response) => {
        this.snippets.set(response.snippets);
        this.filteredSnippets.set(response.snippets);
        this.totalSnippets.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load snippets');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  filterSnippets(): void {
    let filtered = [...this.snippets()];
    
    // Apply search
    const query = this.searchQuery();
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(lowerQuery) ||
        s.content.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply sort
    const sortVal = this.sortBy();
    if (sortVal === 'Newest First') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortVal === 'Oldest First') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortVal === 'Name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    this.filteredSnippets.set(filtered);
  }

  onSearchChange(): void {
    this.filterSnippets();
  }

  setLanguage(language: string): void {
    this.selectedLanguage.set(language);
  }

  setSortBy(sort: string): void {
    this.sortBy.set(sort);
    this.filterSnippets();
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.newSnippet.set({
      title: '',
      content: '',
      language: 'javascript'
    });
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createSnippet(): void {
    const snippet = this.newSnippet();
    if (!snippet.title.trim() || !snippet.content.trim()) return;
    
    this.snippetsService.createSnippet(snippet).subscribe({
      next: (created) => {
        this.closeCreateModal();
        this.router.navigate(['/snippets', created.id]);
      },
      error: (err) => {
        this.error.set('Failed to create snippet');
        console.error(err);
      }
    });
  }

  openSnippet(snippet: PrivateSnippet): void {
    this.router.navigate(['/snippets', snippet.id]);
  }

  deleteSnippet(event: Event, snippet: PrivateSnippet): void {
    event.stopPropagation();
    
    if (!confirm(`Delete "${snippet.title}"?`)) return;
    
    this.snippetsService.deleteSnippet(snippet.id).subscribe({
      next: () => {
        this.loadSnippets();
      },
      error: (err) => {
        this.error.set('Failed to delete snippet');
        console.error(err);
      }
    });
  }

  getLanguageIcon(language: string): string {
    const icons: Record<string, string> = {
      'javascript': 'code',
      'typescript': 'data_object',
      'python': 'terminal',
      'java': 'code',
      'css': 'palette',
      'html': 'language',
      'go': 'tune',
      'rust': 'settings',
      'php': 'dns'
    };
    return icons[language.toLowerCase()] || 'code';
  }

  getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      'javascript': 'bg-yellow-900/30 text-yellow-400',
      'typescript': 'bg-blue-900/30 text-blue-400',
      'python': 'bg-green-900/30 text-green-400',
      'java': 'bg-orange-900/30 text-orange-400',
      'css': 'bg-purple-900/30 text-purple-400',
      'html': 'bg-red-900/30 text-red-400',
      'go': 'bg-cyan-900/30 text-cyan-400',
      'rust': 'bg-orange-900/30 text-orange-400'
    };
    return colors[language.toLowerCase()] || 'bg-gray-800 text-gray-400';
  }

  formatDate(date: string): string {
    const now = new Date();
    const snippetDate = new Date(date);
    const diffMs = now.getTime() - snippetDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Updated just now';
    if (diffHours < 24) return `Updated ${diffHours} hours ago`;
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    
    return `Updated ${snippetDate.toLocaleDateString()}`;
  }

  getPreviewLines(content: string): string {
    const lines = content.split('\n').slice(0, 3);
    return lines.join('\n');
  }

  // Helper methods for updating newSnippet signal
  updateNewSnippetTitle(title: string): void {
    this.newSnippet.set({...this.newSnippet(), title});
  }

  updateNewSnippetLanguage(language: string): void {
    this.newSnippet.set({...this.newSnippet(), language});
  }

  updateNewSnippetContent(content: string): void {
    this.newSnippet.set({...this.newSnippet(), content});
  }
}
