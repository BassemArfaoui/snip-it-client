import { Component, signal, computed, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrivateSnippetsService, PrivateSnippet, SnippetVersion, UpdateSnippetDto } from '../../services/private-snippets.service';

@Component({
  selector: 'app-snippet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './snippet-detail.component.html',
  styleUrls: ['./snippet-detail.component.css']
})
export class SnippetDetailComponent implements OnInit, OnDestroy {
  private snippetsService = inject(PrivateSnippetsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  snippetId = signal<number>(0);
  snippet = signal<PrivateSnippet | null>(null);
  versions = signal<SnippetVersion[]>([]);
  loading = signal(false);
  error = signal('');
  successMessage = signal('');
  
  // Edit mode
  isEditing = signal(false);
  editedSnippet = signal<UpdateSnippetDto>({});
  
  // Tabs
  selectedTab = signal<'code' | 'versions' | 'settings'>('code');
  
  // Transform modal
  showTransformModal = signal(false);
  transformData = signal({
    title: '',
    description: '',
    publish: false
  });
  
  // Version history
  showVersionHistory = signal(false);
  selectedVersion = signal<SnippetVersion | null>(null);
  showVersionsPanel = signal(false);
  expandedVersionId = signal<number | null>(null);

  languages = ['javascript', 'typescript', 'python', 'java', 'css', 'html', 'go', 'rust', 'php', 'cpp', 'c', 'ruby', 'swift'];

  // Computed signals
  isLoading = computed(() => this.loading());
  hasError = computed(() => this.error().length > 0);
  hasSuccess = computed(() => this.successMessage().length > 0);
  isShowingTransformModal = computed(() => this.showTransformModal());
  isShowingVersionHistory = computed(() => this.showVersionHistory());

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        this.snippetId.set(id);
        this.loadSnippet();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSnippet(): void {
    this.loading.set(true);
    this.error.set('');
    
    this.snippetsService.getSnippetById(this.snippetId()).subscribe({
      next: (snippet) => {
        this.snippet.set(snippet);
        this.editedSnippet.set({
          title: snippet.title,
          content: snippet.content,
          language: snippet.language
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load snippet');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  loadVersions(force: boolean = false): void {
    // Only load if not already loaded or if forced
    if (!force && this.versions().length > 0) return;
    
    this.snippetsService.getVersions(this.snippetId()).subscribe({
      next: (response) => {
        console.log('Versions loaded:', response); // Debug log
        this.versions.set(response.versions || []);
      },
      error: (err) => {
        console.error('Failed to load versions', err);
        this.error.set('Failed to load version history');
      }
    });
  }

  toggleVersionsPanel(): void {
    this.showVersionsPanel.set(!this.showVersionsPanel());
    if (this.showVersionsPanel() && this.versions().length === 0) {
      this.loadVersions();
    }
  }

  toggleVersionExpansion(versionId: number): void {
    if (this.expandedVersionId() === versionId) {
      this.expandedVersionId.set(null);
    } else {
      this.expandedVersionId.set(versionId);
    }
  }

  setTab(tab: 'code' | 'versions' | 'settings'): void {
    this.selectedTab.set(tab);
    if (tab === 'versions' && this.versions().length === 0) {
      this.loadVersions();
    }
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      // Cancel editing
      this.isEditing.set(false);
      const currentSnippet = this.snippet();
      if (currentSnippet) {
        this.editedSnippet.set({
          title: currentSnippet.title,
          content: currentSnippet.content,
          language: currentSnippet.language
        });
      }
    } else {
      this.isEditing.set(true);
    }
  }

  saveChanges(): void {
    const edited = this.editedSnippet();
    if (!edited.title?.trim() || !edited.content?.trim()) {
      this.error.set('Title and content are required');
      return;
    }
    
    this.snippetsService.updateSnippet(this.snippetId(), edited).subscribe({
      next: (snippet) => {
        this.snippet.set(snippet);
        this.isEditing.set(false);
        this.successMessage.set('Snippet saved successfully!');
        setTimeout(() => this.successMessage.set(''), 3000);
        // Reload versions to show the new version
        this.loadVersions(true);
      },
      error: (err) => {
        this.error.set('Failed to save snippet');
        console.error(err);
      }
    });
  }

  deleteSnippet(): void {
    const currentSnippet = this.snippet();
    if (!confirm('Delete this snippet? This action cannot be undone.')) return;
    
    this.snippetsService.deleteSnippet(this.snippetId()).subscribe({
      next: () => {
        this.router.navigate(['/snippets']);
      },
      error: (err) => {
        this.error.set('Failed to delete snippet');
        console.error(err);
      }
    });
  }

  openTransformModal(): void {
    const currentSnippet = this.snippet();
    this.showTransformModal.set(true);
    this.transformData.set({
      title: currentSnippet?.title || '',
      description: '',
      publish: false
    });
  }

  closeTransformModal(): void {
    this.showTransformModal.set(false);
  }

  transformToPost(): void {
    const data = this.transformData();
    if (!data.title.trim() || !data.description.trim()) {
      this.error.set('Title and description are required');
      return;
    }
    
    this.snippetsService.transformToPost(this.snippetId(), data).subscribe({
      next: (post) => {
        this.closeTransformModal();
        this.successMessage.set('Transformed to post successfully!');
        setTimeout(() => {
          this.router.navigate(['/posts', post.id]);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Failed to transform snippet');
        console.error(err);
      }
    });
  }

  copyCode(): void {
    const currentSnippet = this.snippet();
    if (currentSnippet) {
      navigator.clipboard.writeText(currentSnippet.content);
      this.successMessage.set('Code copied to clipboard!');
      setTimeout(() => this.successMessage.set(''), 2000);
    }
  }

  viewVersion(version: SnippetVersion): void {
    this.selectedVersion.set(version);
    this.showVersionHistory.set(true);
  }

  restoreVersion(version: SnippetVersion): void {
    if (!confirm('Restore this version? This will replace your current content.')) return;
    
    this.snippetsService.restoreVersion(this.snippetId(), version.id).subscribe({
      next: (snippet) => {
        this.snippet.set(snippet);
        this.editedSnippet.set({
          title: snippet.title,
          content: snippet.content,
          language: snippet.language
        });
        this.successMessage.set('Version restored successfully!');
        setTimeout(() => this.successMessage.set(''), 3000);
        // Collapse the expanded version
        this.expandedVersionId.set(null);
      },
      error: (err) => {
        this.error.set('Failed to restore version');
        console.error(err);
      }
    });
  }

  deleteVersion(version: SnippetVersion): void {
    if (!confirm('Delete this version?')) return;
    
    this.snippetsService.deleteVersion(this.snippetId(), version.id).subscribe({
      next: () => {
        this.loadVersions();
        this.successMessage.set('Version deleted');
        setTimeout(() => this.successMessage.set(''), 2000);
      },
      error: (err) => {
        this.error.set('Failed to delete version');
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

  // Helper methods for updating nested signal properties
  updateEditedTitle(title: string): void {
    this.editedSnippet.set({...this.editedSnippet(), title});
  }

  updateEditedContent(content: string): void {
    this.editedSnippet.set({...this.editedSnippet(), content});
  }

  updateEditedLanguage(language: string): void {
    this.editedSnippet.set({...this.editedSnippet(), language});
  }

  updateTransformTitle(title: string): void {
    this.transformData.set({...this.transformData(), title});
  }

  updateTransformDescription(description: string): void {
    this.transformData.set({...this.transformData(), description});
  }

  updateTransformPublish(publish: boolean): void {
    this.transformData.set({...this.transformData(), publish});
  }
}
