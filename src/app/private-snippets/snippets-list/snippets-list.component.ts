import { Component, OnInit } from '@angular/core';
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
export class SnippetsListComponent implements OnInit {
  snippets: PrivateSnippet[] = [];
  filteredSnippets: PrivateSnippet[] = [];
  loading = false;
  error = '';
  
  // Filter states
  searchQuery = '';
  selectedLanguage = 'All';
  selectedTags: string[] = [];
  sortBy = 'Newest First';
  
  // Create snippet modal
  showCreateModal = false;
  newSnippet: CreateSnippetDto = {
    title: '',
    content: '',
    language: 'javascript'
  };
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalSnippets = 0;

  languages = ['All', 'JavaScript', 'TypeScript', 'Python', 'Java', 'CSS', 'HTML', 'Go', 'Rust', 'PHP'];

  constructor(
    private snippetsService: PrivateSnippetsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSnippets();
  }

  loadSnippets(): void {
    this.loading = true;
    this.error = '';
    
    this.snippetsService.getSnippets({
      page: this.currentPage,
      size: this.pageSize,
      q: this.searchQuery || undefined,
      language: this.selectedLanguage !== 'All' ? this.selectedLanguage : undefined,
      tags: this.selectedTags.length > 0 ? this.selectedTags : undefined
    }).subscribe({
      next: (response) => {
        this.snippets = response.snippets;
        this.filteredSnippets = response.snippets;
        this.totalSnippets = response.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load snippets';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterSnippets(): void {
    let filtered = [...this.snippets];
    
    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query)
      );
    }
    
    // Apply sort
    if (this.sortBy === 'Newest First') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'Oldest First') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (this.sortBy === 'Name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    this.filteredSnippets = filtered;
  }

  onSearchChange(): void {
    this.filterSnippets();
  }

  setLanguage(language: string): void {
    this.selectedLanguage = language;
    this.loadSnippets();
  }

  setSortBy(sort: string): void {
    this.sortBy = sort;
    this.filterSnippets();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newSnippet = {
      title: '',
      content: '',
      language: 'javascript'
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createSnippet(): void {
    if (!this.newSnippet.title.trim() || !this.newSnippet.content.trim()) return;
    
    this.snippetsService.createSnippet(this.newSnippet).subscribe({
      next: (snippet) => {
        this.closeCreateModal();
        this.router.navigate(['/snippets', snippet.id]);
      },
      error: (err) => {
        this.error = 'Failed to create snippet';
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
        this.error = 'Failed to delete snippet';
        console.error(err);
      }
    });
  }

  getLanguageIcon(language: string): string {
    const icons: Record<string, string> = {
      'javascript': '💛',
      'typescript': '💙',
      'python': '🐍',
      'java': '☕',
      'css': '🎨',
      'html': '📄',
      'go': '🔷',
      'rust': '🦀',
      'php': '🐘'
    };
    return icons[language.toLowerCase()] || '📝';
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
}
