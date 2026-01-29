import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssuesService, Issue, IssueFilters } from '../../services/issues.service';
import { AuthService } from '../../auth.service';
import { Collection, CollectionsService } from '../../services/collections.service';
import { LanguageBadgeComponent } from '../../shared/language-badge/language-badge.component';
import { ResolvedBadgeComponent } from '../../shared/resolved-badge/resolved-badge.component';
import { DropdownComponent, DropdownOption } from '../../shared/dropdown/dropdown.component';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LanguageBadgeComponent,
    ResolvedBadgeComponent,
    DropdownComponent
  ],
  templateUrl: './issues-list.component.html'
})
export class IssuesListComponent implements OnInit {
  issues: Issue[] = [];
  loading = false;
  error: string | null = null;

  saveMenuOpenIssueId: number | null = null;
  collectionsLoading = false;
  collections: Collection[] = [];
  savingToCollection = false;
  toastMessage: string | null = null;
  private toastTimeout?: number;

  private readonly defaultSavedItemsCollectionName = 'Saved Items';
  private readonly legacyDefaultCollectionNames = ['Saved Posts', 'Saved Issues', 'Saved Solutions'];

  // Filters
  selectedLanguage = '';
  resolvedFilter = 'all'; // 'all', 'resolved', 'unresolved'
  currentPage = 1;
  limit = 10;


  // Dropdown options
  languageOptions: DropdownOption[] = [
    { value: '', label: 'All Languages' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'cpp', label: 'C++' }
  ];

  resolvedOptions: DropdownOption[] = [
    { value: 'all', label: 'All Issues' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'resolved', label: 'Resolved' }
  ];

  isAuthenticated = false;

  constructor(
    private issuesService: IssuesService,
    private authService: AuthService,
    private collectionsService: CollectionsService,
  ) {}

  ngOnInit() {
    this.isAuthenticated = !!this.authService.getAccessToken();
    this.loadIssues();
  }

  loadIssues() {
    this.loading = true;
    this.error = null;

    const filters: IssueFilters = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.selectedLanguage) {
      filters.language = this.selectedLanguage;
    }

    if (this.resolvedFilter !== 'all') {
      filters.is_resolved = this.resolvedFilter === 'resolved';
    }

    this.issuesService.getIssues(filters).subscribe({
      next: (issues) => {
        this.issues = issues;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load issues. Please try again.';
        this.loading = false;
        console.error('Error loading issues:', err);
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadIssues();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  toggleSaveMenu(issueId: number, event: MouseEvent) {
    event.stopPropagation();
    this.saveMenuOpenIssueId = this.saveMenuOpenIssueId === issueId ? null : issueId;
    if (this.saveMenuOpenIssueId !== null && this.collections.length === 0) {
      this.loadCollections();
    }
  }

  loadCollections() {
    if (this.collectionsLoading) return;
    this.collectionsLoading = true;

    this.collectionsService.getCollections({ page: 1, size: 100 }).subscribe({
      next: (res) => {
        this.collections = res.collections ?? [];
        this.collectionsLoading = false;
      },
      error: () => {
        this.collectionsLoading = false;
      }
    });
  }

  saveIssueToDefaultCollection(issueId: number) {
    this.ensureDefaultSavedIssuesCollectionId().then((collectionId) => {
      if (!collectionId) {
        this.showToast('Save failed');
        return;
      }
      this.saveIssueToCollection(issueId, collectionId);
    });
  }

  saveIssueToCollection(issueId: number, collectionId: number) {
    if (this.savingToCollection) return;
    this.savingToCollection = true;

    this.collectionsService.addItem(collectionId, { targetId: issueId, targetType: 'ISSUE' }).subscribe({
      next: () => {
        this.savingToCollection = false;
        this.saveMenuOpenIssueId = null;
        this.showToast('Saved');
      },
      error: () => {
        this.savingToCollection = false;
        this.saveMenuOpenIssueId = null;
        this.showToast('Already saved');
      }
    });
  }

  private async ensureDefaultSavedIssuesCollectionId(): Promise<number | null> {
    const normalize = (name?: string | null) => (name ?? '').trim().toLowerCase();

    if (this.collections.length === 0) {
      await new Promise<void>((resolve) => {
        this.collectionsService.getCollections({ page: 1, size: 100 }).subscribe({
          next: (res) => {
            this.collections = res.collections ?? [];
            resolve();
          },
          error: () => resolve(),
        });
      });
    }

    const desiredName = this.defaultSavedItemsCollectionName;
    const desired = this.collections.find((c) => normalize(c.name) === normalize(desiredName));
    if (desired) return desired.id;

    const legacy = this.collections.find((c) =>
      this.legacyDefaultCollectionNames.some((legacyName) => normalize(c.name) === normalize(legacyName))
    );

    if (legacy) {
      await new Promise<void>((resolve) => {
        this.collectionsService.updateCollection(legacy.id, { name: desiredName }).subscribe({
          next: () => {
            this.collections = this.collections.map((c) => (c.id === legacy.id ? { ...c, name: desiredName } : c));
            resolve();
          },
          error: () => resolve(),
        });
      });
      return legacy.id;
    }

    return await new Promise<number | null>((resolve) => {
      this.collectionsService.createCollection({ name: desiredName }).subscribe({
        next: (created) => {
          this.collections = [created, ...this.collections];
          resolve(created.id);
        },
        error: () => resolve(null),
      });
    });
  }

  private showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) {
      window.clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = window.setTimeout(() => {
      this.toastMessage = null;
    }, 1800);
  }
}
