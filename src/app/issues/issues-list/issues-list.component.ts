import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssuesService, Issue, IssueFilters } from '../../services/issues.service';
import { AuthService } from '../../auth.service';
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
    private authService: AuthService
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
}
