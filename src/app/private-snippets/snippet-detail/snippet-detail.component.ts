import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PrivateSnippetsService, PrivateSnippet, SnippetVersion, UpdateSnippetDto } from '../../services/private-snippets.service';

@Component({
  selector: 'app-snippet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './snippet-detail.component.html',
  styleUrls: ['./snippet-detail.component.css']
})
export class SnippetDetailComponent implements OnInit {
  snippetId!: number;
  snippet: PrivateSnippet | null = null;
  versions: SnippetVersion[] = [];
  loading = false;
  error = '';
  successMessage = '';
  
  // Edit mode
  isEditing = false;
  editedSnippet: UpdateSnippetDto = {};
  
  // Tabs
  selectedTab: 'code' | 'versions' | 'settings' = 'code';
  
  // Transform modal
  showTransformModal = false;
  transformData = {
    title: '',
    description: '',
    publish: false
  };
  
  // Version history
  showVersionHistory = false;
  selectedVersion: SnippetVersion | null = null;

  languages = ['javascript', 'typescript', 'python', 'java', 'css', 'html', 'go', 'rust', 'php', 'cpp', 'c', 'ruby', 'swift'];

  constructor(
    private snippetsService: PrivateSnippetsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.snippetId = +params['id'];
      this.loadSnippet();
    });
  }

  loadSnippet(): void {
    this.loading = true;
    this.error = '';
    
    this.snippetsService.getSnippetById(this.snippetId).subscribe({
      next: (snippet) => {
        this.snippet = snippet;
        this.editedSnippet = {
          title: snippet.title,
          content: snippet.content,
          language: snippet.language
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load snippet';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadVersions(): void {
    this.snippetsService.getVersions(this.snippetId).subscribe({
      next: (response) => {
        this.versions = response.versions;
      },
      error: (err) => {
        console.error('Failed to load versions', err);
      }
    });
  }

  setTab(tab: 'code' | 'versions' | 'settings'): void {
    this.selectedTab = tab;
    if (tab === 'versions' && this.versions.length === 0) {
      this.loadVersions();
    }
  }

  toggleEdit(): void {
    if (this.isEditing) {
      // Cancel editing
      this.isEditing = false;
      if (this.snippet) {
        this.editedSnippet = {
          title: this.snippet.title,
          content: this.snippet.content,
          language: this.snippet.language
        };
      }
    } else {
      this.isEditing = true;
    }
  }

  saveChanges(): void {
    if (!this.editedSnippet.title?.trim() || !this.editedSnippet.content?.trim()) {
      this.error = 'Title and content are required';
      return;
    }
    
    this.snippetsService.updateSnippet(this.snippetId, this.editedSnippet).subscribe({
      next: (snippet) => {
        this.snippet = snippet;
        this.isEditing = false;
        this.successMessage = 'Snippet saved successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to save snippet';
        console.error(err);
      }
    });
  }

  deleteSnippet(): void {
    if (!confirm('Delete this snippet? This action cannot be undone.')) return;
    
    this.snippetsService.deleteSnippet(this.snippetId).subscribe({
      next: () => {
        this.router.navigate(['/snippets']);
      },
      error: (err) => {
        this.error = 'Failed to delete snippet';
        console.error(err);
      }
    });
  }

  openTransformModal(): void {
    this.showTransformModal = true;
    this.transformData = {
      title: this.snippet?.title || '',
      description: '',
      publish: false
    };
  }

  closeTransformModal(): void {
    this.showTransformModal = false;
  }

  transformToPost(): void {
    if (!this.transformData.title.trim() || !this.transformData.description.trim()) {
      this.error = 'Title and description are required';
      return;
    }
    
    this.snippetsService.transformToPost(this.snippetId, this.transformData).subscribe({
      next: (post) => {
        this.closeTransformModal();
        this.successMessage = 'Transformed to post successfully!';
        setTimeout(() => {
          this.router.navigate(['/posts', post.id]);
        }, 1500);
      },
      error: (err) => {
        this.error = 'Failed to transform snippet';
        console.error(err);
      }
    });
  }

  copyCode(): void {
    if (this.snippet) {
      navigator.clipboard.writeText(this.snippet.content);
      this.successMessage = 'Code copied to clipboard!';
      setTimeout(() => this.successMessage = '', 2000);
    }
  }

  viewVersion(version: SnippetVersion): void {
    this.selectedVersion = version;
  }

  restoreVersion(version: SnippetVersion): void {
    if (!confirm('Restore this version? Current content will be saved as a new version.')) return;
    
    this.editedSnippet.content = version.content;
    this.saveChanges();
  }

  deleteVersion(version: SnippetVersion): void {
    if (!confirm('Delete this version?')) return;
    
    this.snippetsService.deleteVersion(this.snippetId, version.id).subscribe({
      next: () => {
        this.loadVersions();
        this.successMessage = 'Version deleted';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (err) => {
        this.error = 'Failed to delete version';
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/snippets']);
  }

  getLineCount(content: string): number {
    return content.split('\n').length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
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
}
