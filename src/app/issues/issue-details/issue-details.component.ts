import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssuesService, IssueDetails } from '../../services/issues.service';
import { SolutionsService, Solution } from '../../services/solutions.service';
import { VotesService, VoteType, TargetType } from '../../services/votes.service';
import { AuthService } from '../../auth.service';
import { LanguageBadgeComponent } from '../../shared/language-badge/language-badge.component';
import { ResolvedBadgeComponent } from '../../shared/resolved-badge/resolved-badge.component';
import { AcceptedBadgeComponent } from '../../shared/accepted-badge/accepted-badge.component';
import { VoteButtonsComponent } from '../../shared/vote-buttons/vote-buttons.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-issue-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LanguageBadgeComponent,
    ResolvedBadgeComponent,
    AcceptedBadgeComponent,
    VoteButtonsComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './issue-details.component.html'
})
export class IssueDetailsComponent implements OnInit {
  issue: IssueDetails | null = null;
  solutions: Solution[] = [];
  loading = false;
  error: string | null = null;
  
  currentUserId: number | null = null;
  isAuthenticated = false;
  
  // Solution form
  showSolutionForm = false;
  solutionTextContent = '';
  solutionExternalLink = '';
  submittingSolution = false;
  solutionError: string | null = null;
  
  // Edit solution
  editingSolutionId: number | null = null;
  editSolutionTextContent = '';
  editSolutionExternalLink = '';
  
  // Delete dialogs
  showDeleteIssueDialog = false;
  showDeleteSolutionDialog = false;
  deletingSolutionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issuesService: IssuesService,
    private solutionsService: SolutionsService,
    private votesService: VotesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAuthenticated = !!this.authService.getAccessToken();
    this.currentUserId = this.authService.getUserId();
    
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadIssue(id);
        this.loadSolutions(id);
      }
    });
  }

  loadIssue(id: number) {
    this.loading = true;
    this.error = null;
    
    this.issuesService.getIssueById(id).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load issue. Please try again.';
        this.loading = false;
        console.error('Error loading issue:', err);
      }
    });
  }

  loadSolutions(issueId: number) {
    this.solutionsService.getSolutionsForIssue(issueId).subscribe({
      next: (solutions) => {
        // Sort: accepted first, then by likes
        this.solutions = solutions.sort((a, b) => {
          if (a.isAccepted && !b.isAccepted) return -1;
          if (!a.isAccepted && b.isAccepted) return 1;
          return b.likesCount - a.likesCount;
        });
      },
      error: (err) => {
        console.error('Error loading solutions:', err);
      }
    });
  }

  isIssueOwner(): boolean {
    return !!this.issue?.author && this.issue.author.id === this.currentUserId;
  }

  isSolutionOwner(solution: Solution): boolean {
    return !!solution.contributor && solution.contributor.id === this.currentUserId;
  }

  canEditSolution(solution: Solution): boolean {
    return this.isSolutionOwner(solution) && !solution.isAccepted;
  }

  canAcceptSolution(): boolean {
    return this.isIssueOwner() && !this.issue?.is_resolved;
  }

  // Vote on issue
  voteOnIssue(voteType: VoteType) {
    if (!this.isAuthenticated || !this.issue) return;
    
    this.votesService.vote({
      targetId: this.issue.id,
      targetType: 'ISSUE',
      voteType
    }).subscribe({
      next: () => {
        if (this.issue) {
          this.loadIssue(this.issue.id);
        }
      },
      error: (err) => console.error('Error voting:', err)
    });
  }

  // Vote on solution
  voteOnSolution(solution: Solution, voteType: VoteType) {
    if (!this.isAuthenticated) return;
    
    this.votesService.vote({
      targetId: solution.id,
      targetType: 'SOLUTION',
      voteType
    }).subscribe({
      next: () => {
        if (this.issue) {
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => console.error('Error voting:', err)
    });
  }

  // Solution CRUD
  toggleSolutionForm() {
    this.showSolutionForm = !this.showSolutionForm;
    if (!this.showSolutionForm) {
      this.solutionTextContent = '';
      this.solutionExternalLink = '';
      this.solutionError = null;
    }
  }

  submitSolution() {
    if (!this.issue) return;
    
    // Trim values first
    const textContent = this.solutionTextContent.trim();
    const externalLink = this.solutionExternalLink.trim();
    
    // Validate that at least one field has content
    if (!textContent && !externalLink) {
      this.solutionError = 'Please provide either text content or an external link';
      return;
    }
    
    // Validate text content length if provided
    if (textContent && textContent.length < 10) {
      this.solutionError = 'Text content must be at least 10 characters';
      return;
    }
    
    this.submittingSolution = true;
    this.solutionError = null;
    
    // Build request with only non-empty values
    const request: any = {};
    if (textContent) {
      request.textContent = textContent;
    }
    if (externalLink) {
      request.externalLink = externalLink;
    }
    
    this.solutionsService.createSolution(this.issue.id, request).subscribe({
      next: () => {
        this.submittingSolution = false;
        this.toggleSolutionForm();
        this.loadSolutions(this.issue!.id);
        this.loadIssue(this.issue!.id);
      },
      error: (err) => {
        this.submittingSolution = false;
        this.solutionError = err.error?.message || 'Failed to submit solution. Please try again.';
        console.error('Error submitting solution:', err);
      }
    });
}

  startEditSolution(solution: Solution) {
    this.editingSolutionId = solution.id;
    this.editSolutionTextContent = solution.textContent || '';
    this.editSolutionExternalLink = solution.externalLink || '';
  }

  cancelEditSolution() {
    this.editingSolutionId = null;
    this.editSolutionTextContent = '';
    this.editSolutionExternalLink = '';
  }

  submitEditSolution() {
    if (this.editingSolutionId === null) return;
    
    const request: any = {};
    if (this.editSolutionTextContent.trim()) {
      request.textContent = this.editSolutionTextContent.trim();
    }
    if (this.editSolutionExternalLink.trim()) {
      request.externalLink = this.editSolutionExternalLink.trim();
    }
    
    this.solutionsService.updateSolution(this.editingSolutionId, request).subscribe({
      next: () => {
        this.cancelEditSolution();
        if (this.issue) {
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => {
        console.error('Error updating solution:', err);
      }
    });
  }

  confirmDeleteSolution(solutionId: number) {
    this.deletingSolutionId = solutionId;
    this.showDeleteSolutionDialog = true;
  }

  deleteSolution() {
    if (this.deletingSolutionId === null) return;
    
    this.solutionsService.deleteSolution(this.deletingSolutionId).subscribe({
      next: () => {
        this.showDeleteSolutionDialog = false;
        this.deletingSolutionId = null;
        if (this.issue) {
          this.loadSolutions(this.issue.id);
          this.loadIssue(this.issue.id);
        }
      },
      error: (err) => {
        console.error('Error deleting solution:', err);
      }
    });
  }

  acceptSolution(solutionId: number) {
    this.solutionsService.acceptSolution(solutionId).subscribe({
      next: () => {
        if (this.issue) {
          this.loadIssue(this.issue.id);
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => {
        console.error('Error accepting solution:', err);
      }
    });
  }

  // Issue delete
  confirmDeleteIssue() {
    this.showDeleteIssueDialog = true;
  }

  deleteIssue() {
    if (!this.issue) return;
    
    this.issuesService.deleteIssue(this.issue.id).subscribe({
      next: () => {
        this.router.navigate(['/issues']);
      },
      error: (err) => {
        console.error('Error deleting issue:', err);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
