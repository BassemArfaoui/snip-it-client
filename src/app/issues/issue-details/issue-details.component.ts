import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssuesService, IssueDetails } from '../../services/issues.service';
import { SolutionsService, Solution } from '../../services/solutions.service';
import { VotesService, VoteType } from '../../services/votes.service';
import { CommentsService, Comment } from '../../services/comments.service';
import { AuthService } from '../../auth.service';
import { Collection, CollectionsService } from '../../services/collections.service';
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
  solutionSnippetTitle = '';
  solutionSnippetLanguage = '';
  solutionSnippetContent = '';
  solutionImagePreview: string | null = null;
  solutionImageData: string | null = null;
  submittingSolution = false;
  solutionError: string | null = null;

  // Edit solution
  editingSolutionId: number | null = null;
  editSolutionTextContent = '';
  editSolutionExternalLink = '';
  editSolutionSnippetTitle = '';
  editSolutionSnippetLanguage = '';
  editSolutionSnippetContent = '';

  // Delete dialogs
  showDeleteIssueDialog = false;
  showDeleteSolutionDialog = false;
  deletingSolutionId: number | null = null;

  // Comments
  solutionComments: { [solutionId: number]: Comment[] } = {};
  showCommentsFor: number | null = null;
  submittingComment: { [solutionId: number]: boolean } = {};

  // Image modal
  showImageModal = false;
  selectedImageUrl: string | null = null;

  // Toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimeout: any;

  // Accept solution loading
  acceptingSolutionId: number | null = null;

  // Save solutions
  saveMenuOpenSolutionId: number | null = null;
  collectionsLoading = false;
  collections: Collection[] = [];
  savingToCollection = false;
  private readonly defaultSavedItemsCollectionName = 'Saved Items';
  private readonly legacyDefaultCollectionNames = ['Saved Posts', 'Saved Issues', 'Saved Solutions'];

  // Image upload settings
  readonly maxUploadSize = 2 * 1024 * 1024; // 2MB
  readonly maxImageDimension = 1024; // pixels

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issuesService: IssuesService,
    private solutionsService: SolutionsService,
    private votesService: VotesService,
    private commentsService: CommentsService,
    private authService: AuthService,
    private collectionsService: CollectionsService,
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
    return this.issue?.author?.id === this.currentUserId;
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
      this.solutionSnippetTitle = '';
      this.solutionSnippetLanguage = '';
      this.solutionSnippetContent = '';
      this.solutionImagePreview = null;
      this.solutionImageData = null;
      this.solutionError = null;
    }
  }

  isSolutionFormValid(): boolean {
    const textContent = this.solutionTextContent.trim();
    const externalLink = this.solutionExternalLink.trim();
    const hasImage = !!this.solutionImageData;

    const snippetTitle = this.solutionSnippetTitle.trim();
    const snippetLanguage = this.solutionSnippetLanguage.trim();
    const snippetContent = this.solutionSnippetContent.trim();
    const hasAnySnippetField = !!(snippetTitle || snippetLanguage || snippetContent);
    const hasValidSnippet = !!(snippetTitle && snippetLanguage && snippetContent);

    // At least one field must have content
    if (!textContent && !externalLink && !hasImage && !hasAnySnippetField) {
      return false;
    }

    // If text content is provided, it must be at least 10 characters
    if (textContent && textContent.length < 10) {
      return false;
    }

    // If any snippet field is provided, require all snippet fields
    if (hasAnySnippetField && !hasValidSnippet) {
      return false;
    }

    return true;
  }

  submitSolution() {
    if (!this.issue) return;

    // Trim values first
    const textContent = this.solutionTextContent.trim();
    const externalLink = this.solutionExternalLink.trim();
    const imageUrl = this.solutionImageData;

    const snippetTitle = this.solutionSnippetTitle.trim();
    const snippetLanguage = this.solutionSnippetLanguage.trim();
    const snippetContent = this.solutionSnippetContent.trim();
    const hasAnySnippetField = !!(snippetTitle || snippetLanguage || snippetContent);
    const hasValidSnippet = !!(snippetTitle && snippetLanguage && snippetContent);

    // Validate that at least one field has content
    if (!textContent && !externalLink && !imageUrl && !hasAnySnippetField) {
      this.solutionError = 'Please provide text content, a snippet, an external link, or an image';
      return;
    }

    // Validate text content length if provided
    if (textContent && textContent.length < 10) {
      this.solutionError = 'Text content must be at least 10 characters';
      return;
    }

    if (hasAnySnippetField && !hasValidSnippet) {
      this.solutionError = 'Snippet requires title, language, and content';
      return;
    }

    this.submittingSolution = true;
    this.solutionError = null;

    // Build request with only non-empty values
    const request: any = {};
    if (textContent) {
      request.textContent = textContent;
    }
    if (hasValidSnippet) {
      request.snippet = {
        title: snippetTitle,
        language: snippetLanguage,
        content: snippetContent,
      };
    }
    if (externalLink) {
      request.externalLink = externalLink;
    }
    if (imageUrl) {
      request.imageUrl = imageUrl;
    }

    this.solutionsService.createSolution(this.issue.id, request).subscribe({
      next: () => {
        this.submittingSolution = false;
        this.toggleSolutionForm();
        this.showToast('Solution submitted successfully!', 'success');
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
    this.editSolutionSnippetTitle = solution.snippet?.title || '';
    this.editSolutionSnippetLanguage = solution.snippet?.language || '';
    this.editSolutionSnippetContent = solution.snippet?.content || '';
  }

  cancelEditSolution() {
    this.editingSolutionId = null;
    this.editSolutionTextContent = '';
    this.editSolutionExternalLink = '';
    this.editSolutionSnippetTitle = '';
    this.editSolutionSnippetLanguage = '';
    this.editSolutionSnippetContent = '';
  }

  submitEditSolution() {
    if (this.editingSolutionId === null) return;

    const request: any = {};
    if (this.editSolutionTextContent.trim()) {
      request.textContent = this.editSolutionTextContent.trim();
    }

    const snippetTitle = this.editSolutionSnippetTitle.trim();
    const snippetLanguage = this.editSolutionSnippetLanguage.trim();
    const snippetContent = this.editSolutionSnippetContent.trim();
    const hasAnySnippetField = !!(snippetTitle || snippetLanguage || snippetContent);
    const hasValidSnippet = !!(snippetTitle && snippetLanguage && snippetContent);

    if (hasAnySnippetField && !hasValidSnippet) {
      console.error('Snippet requires title, language, and content');
      return;
    }

    if (hasValidSnippet) {
      request.snippet = {
        title: snippetTitle,
        language: snippetLanguage,
        content: snippetContent,
      };
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
        this.showToast('Solution deleted', 'success');
        if (this.issue) {
          this.loadSolutions(this.issue.id);
          this.loadIssue(this.issue.id);
        }
      },
      error: (err) => {
        this.showToast('Failed to delete solution', 'error');
        console.error('Error deleting solution:', err);
      }
    });
  }

  acceptSolution(solutionId: number) {
    this.acceptingSolutionId = solutionId;
    this.solutionsService.acceptSolution(solutionId).subscribe({
      next: () => {
        this.acceptingSolutionId = null;
        this.showToast('Solution accepted successfully!', 'success');
        if (this.issue) {
          this.loadIssue(this.issue.id);
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => {
        this.acceptingSolutionId = null;
        this.showToast('Failed to accept solution', 'error');
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
        this.showToast('Issue deleted successfully', 'success');
        setTimeout(() => this.router.navigate(['/issues']), 500);
      },
      error: (err) => {
        this.showToast('Failed to delete issue', 'error');
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

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return this.formatDate(dateString);
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }

  toggleSaveSolutionMenu(solutionId: number, event: MouseEvent) {
    event.stopPropagation();
    this.saveMenuOpenSolutionId = this.saveMenuOpenSolutionId === solutionId ? null : solutionId;
    if (this.saveMenuOpenSolutionId !== null && this.collections.length === 0) {
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
      },
    });
  }

  saveSolutionToDefaultCollection(solutionId: number) {
    this.ensureDefaultSavedItemsCollectionId().then((collectionId) => {
      if (!collectionId) {
        this.showToast('Save failed', 'error');
        return;
      }
      this.saveSolutionToCollection(solutionId, collectionId);
    });
  }

  saveSolutionToCollection(solutionId: number, collectionId: number) {
    if (this.savingToCollection) return;
    this.savingToCollection = true;

    this.collectionsService.addItem(collectionId, { targetId: solutionId, targetType: 'SOLUTION' }).subscribe({
      next: () => {
        this.savingToCollection = false;
        this.saveMenuOpenSolutionId = null;
        this.showToast('Saved', 'success');
      },
      error: () => {
        this.savingToCollection = false;
        this.saveMenuOpenSolutionId = null;
        this.showToast('Already saved', 'info');
      },
    });
  }

  private async ensureDefaultSavedItemsCollectionId(): Promise<number | null> {
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

    const desired = this.collections.find((c) => normalize(c.name) === normalize(this.defaultSavedItemsCollectionName));
    if (desired) return desired.id;

    const legacy = this.collections.find((c) =>
      this.legacyDefaultCollectionNames.some((legacyName) => normalize(c.name) === normalize(legacyName))
    );
    if (legacy) {
      await new Promise<void>((resolve) => {
        this.collectionsService.updateCollection(legacy.id, { name: this.defaultSavedItemsCollectionName }).subscribe({
          next: () => {
            this.collections = this.collections.map((c) =>
              c.id === legacy.id ? { ...c, name: this.defaultSavedItemsCollectionName } : c
            );
            resolve();
          },
          error: () => resolve(),
        });
      });
      return legacy.id;
    }

    return await new Promise<number | null>((resolve) => {
      this.collectionsService.createCollection({ name: this.defaultSavedItemsCollectionName }).subscribe({
        next: (created) => {
          this.collections = [created, ...this.collections];
          resolve(created.id);
        },
        error: () => resolve(null),
      });
    });
  }

  // Comments methods
  toggleComments(solutionId: number) {
    if (this.showCommentsFor === solutionId) {
      this.showCommentsFor = null;
    } else {
      this.showCommentsFor = solutionId;
      // Initialize submitting state for this solution
      if (this.submittingComment[solutionId] === undefined) {
        this.submittingComment[solutionId] = false;
      }
      // Always load comments to ensure fresh data
      this.loadComments(solutionId);
    }
  }

  loadComments(solutionId: number) {
    this.commentsService.getSolutionComments(solutionId).subscribe({
      next: (response: any) => {
        // Handle nested response structure: response.data.data contains the array
        // or response.data if it's directly the array
        const comments = Array.isArray(response.data) ? response.data : response.data?.data || [];
        this.solutionComments[solutionId] = comments;
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.solutionComments[solutionId] = []; // Set empty array on error
      }
    });
  }


  submitCommentFromTextarea(solutionId: number, textarea: HTMLTextAreaElement) {
    const content = textarea.value?.trim();
    if (!content) {
      alert('Please enter a comment');
      return;
    }

    this.submittingComment[solutionId] = true;

    this.commentsService.createSolutionComment(solutionId, { content }).subscribe({
      next: (comment) => {
        if (!this.solutionComments[solutionId]) {
          this.solutionComments[solutionId] = [];
        }
        this.solutionComments[solutionId].unshift(comment);
        textarea.value = '';
        this.submittingComment[solutionId] = false;

        // Reload solutions to update comment count
        if (this.issue) {
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => {
        console.error('Error submitting comment:', err);
        this.submittingComment[solutionId] = false;
      }
    });
  }


  deleteComment(solutionId: number, commentId: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        this.solutionComments[solutionId] = this.solutionComments[solutionId].filter(
          c => c.id !== commentId
        );

        // Reload solutions to update comment count
        if (this.issue) {
          this.loadSolutions(this.issue.id);
        }
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
      }
    });
  }

  isCommentOwner(comment: Comment): boolean {
    return comment.user.id === this.currentUserId;
  }

  // Image methods
  onSolutionImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > this.maxUploadSize) {
      this.solutionError = 'Image is too large. Please select a file under 2 MB.';
      return;
    }

    this.solutionError = null;
    this.resizeImage(file)
      .then((dataUrl) => {
        this.solutionImageData = dataUrl;
        this.solutionImagePreview = dataUrl;
      })
      .catch(() => {
        this.solutionError = 'Could not process image. Please try a smaller image.';
      });
  }

  removeSolutionImage(): void {
    this.solutionImagePreview = null;
    this.solutionImageData = null;
  }

  private resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > this.maxImageDimension || height > this.maxImageDimension) {
            if (width > height) {
              height = (height / width) * this.maxImageDimension;
              width = this.maxImageDimension;
            } else {
              width = (width / height) * this.maxImageDimension;
              height = this.maxImageDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  openImageModal(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImageUrl = null;
  }
}
