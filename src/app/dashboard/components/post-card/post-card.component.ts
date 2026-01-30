import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommentsService, type Comment } from '../../../services/comments.service';
import { InteractionsService } from '../../../services/interactions.service';
import { PostsService, type Post, type ReactionType } from '../../../services/posts.service';
import { Collection, CollectionsService } from '../../../services/collections.service';
import { userId } from '../../../auth.store';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-card.component.html',
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  readonly hidden = signal(false);

  @ViewChild('commentsScroll') private commentsScroll?: ElementRef<HTMLElement>;
  @ViewChild('commentsSentinel') private commentsSentinel?: ElementRef<HTMLElement>;
  private commentsObserver?: IntersectionObserver;

  readonly reactionTypes: ReactionType[] = ['HEART', 'HELPFUL', 'FIRE', 'FUNNY', 'INCORRECT'];

  readonly commentsModalOpen = signal(false);
  readonly commentsLoading = signal(false);
  readonly commentsLoadingMore = signal(false);
  readonly comments = signal<Comment[]>([]);
  readonly commentsPage = signal(1);
  readonly commentsTotalPages = signal(1);
  readonly commentsLimit = 10;
  readonly commentInput = signal('');
  readonly commentError = signal<string | null>(null);
  readonly submittingComment = signal(false);

  readonly commentMoreOpenId = signal<number | null>(null);

  readonly editCommentOpen = signal(false);
  readonly editCommentSaving = signal(false);
  readonly editCommentError = signal<string | null>(null);
  editCommentId: number | null = null;
  editCommentContent = '';

  readonly confirmCommentDeleteOpen = signal(false);
  commentDeleteId: number | null = null;
  readonly commentDeleting = signal(false);

  readonly fullscreen = signal(false);
  readonly toast = signal<string | null>(null);

  readonly reactionsMenuOpen = signal(false);

  readonly moreMenuOpen = signal(false);

  readonly editModalOpen = signal(false);
  readonly confirmDeleteOpen = signal(false);
  editTitle = '';
  editDescription = '';
  editSnippetTitle = '';
  editSnippetLanguage = '';
  editSnippetContent = '';
  editGithubLink = '';
  readonly editSaving = signal(false);
  readonly editError = signal<string | null>(null);

  readonly deleting = signal(false);

  readonly saveMenuOpen = signal(false);
  readonly collectionsLoading = signal(false);
  readonly collections = signal<Collection[]>([]);
  readonly savingToCollection = signal(false);

  private readonly defaultSavedItemsCollectionName = 'Saved Items';
  private readonly legacyDefaultCollectionNames = ['Saved Posts', 'Saved Issues', 'Saved Solutions'];

  constructor(
    private readonly commentsService: CommentsService,
    private readonly interactionsService: InteractionsService,
    private readonly collectionsService: CollectionsService,
    private readonly postsService: PostsService,
  ) {}

  isOwnPost(): boolean {
    const me = userId();
    return !!me && me === this.post.author.id;
  }

  isOwnComment(c: Comment): boolean {
    const me = userId();
    return !!me && me === c.user.id;
  }

  toggleCommentMore(commentId: number, event: MouseEvent) {
    event.stopPropagation();
    this.commentMoreOpenId.update((current) => (current === commentId ? null : commentId));
  }

  closeCommentMore(event?: MouseEvent) {
    event?.stopPropagation();
    this.commentMoreOpenId.set(null);
  }

  openEditComment(c: Comment, event: MouseEvent) {
    event.stopPropagation();
    this.closeCommentMore();

    this.editCommentError.set(null);
    this.editCommentId = c.id;
    this.editCommentContent = c.content ?? '';
    this.editCommentOpen.set(true);
  }

  closeEditComment(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.editCommentSaving()) return;
    this.editCommentOpen.set(false);
    this.editCommentError.set(null);
    this.editCommentId = null;
    this.editCommentContent = '';
  }

  saveCommentEdit(event: MouseEvent) {
    event.stopPropagation();
    const id = this.editCommentId;
    if (!id) return;
    if (this.editCommentSaving()) return;

    const content = this.editCommentContent.trim();
    if (!content) {
      this.editCommentError.set('Comment cannot be empty.');
      return;
    }

    this.editCommentSaving.set(true);
    this.editCommentError.set(null);

    this.commentsService.updateComment(id, { content }).subscribe({
      next: (updated) => {
        this.comments.update((current) =>
          current.map((c) => (c.id === updated.id ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c))
        );
        this.editCommentSaving.set(false);
        this.editCommentOpen.set(false);
        this.editCommentId = null;
        this.editCommentContent = '';
        this.showToast('Comment updated');
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to update comment';
        this.editCommentError.set(typeof message === 'string' ? message : 'Failed to update comment');
        this.editCommentSaving.set(false);
      },
    });
  }

  openDeleteCommentConfirm(c: Comment, event: MouseEvent) {
    event.stopPropagation();
    this.closeCommentMore();
    this.confirmCommentDeleteOpen.set(true);
    this.commentDeleteId = c.id;
  }

  closeDeleteCommentConfirm(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.commentDeleting()) return;
    this.confirmCommentDeleteOpen.set(false);
    this.commentDeleteId = null;
  }

  confirmDeleteComment(event: MouseEvent) {
    event.stopPropagation();
    const id = this.commentDeleteId;
    if (!id) return;
    if (this.commentDeleting()) return;

    this.commentDeleting.set(true);

    this.commentsService.deleteComment(id).subscribe({
      next: () => {
        this.comments.update((current) => current.filter((c) => c.id !== id));
        this.post.commentsCount = Math.max(0, (this.post.commentsCount ?? 0) - 1);
        this.commentDeleting.set(false);
        this.confirmCommentDeleteOpen.set(false);
        this.commentDeleteId = null;
        this.showToast('Comment deleted');
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to delete comment';
        this.commentDeleting.set(false);
        this.showToast(typeof message === 'string' ? message : 'Failed to delete comment');
      },
    });
  }

  toggleMoreMenu(event: MouseEvent) {
    event.stopPropagation();

    // Keep menus from stacking.
    this.saveMenuOpen.set(false);
    this.reactionsMenuOpen.set(false);

    this.moreMenuOpen.update((open) => !open);
  }

  closeMoreMenu(event?: MouseEvent) {
    event?.stopPropagation();
    this.moreMenuOpen.set(false);
  }

  openEditModal(event: MouseEvent) {
    event.stopPropagation();
    this.closeMoreMenu();

    this.editError.set(null);

    this.editTitle = this.post.title ?? '';
    this.editDescription = this.post.description ?? '';
    this.editSnippetTitle = this.post.snippet?.title ?? '';
    this.editSnippetLanguage = this.post.snippet?.language ?? '';
    this.editSnippetContent = this.post.snippet?.content ?? '';
    this.editGithubLink = this.post.githubLink ?? '';

    this.editModalOpen.set(true);
  }

  closeEditModal(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.editSaving()) return;
    this.editModalOpen.set(false);
    this.editError.set(null);
  }

  openDeleteConfirm(event: MouseEvent) {
    event.stopPropagation();
    this.closeMoreMenu();
    this.confirmDeleteOpen.set(true);
  }

  closeDeleteConfirm(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.deleting()) return;
    this.confirmDeleteOpen.set(false);
  }

  saveEdit(event: MouseEvent) {
    event.stopPropagation();
    if (this.editSaving()) return;

    const title = this.editTitle.trim();
    const description = this.editDescription.trim();
    const snippetContent = this.editSnippetContent.trim();
    const snippetLanguage = this.editSnippetLanguage.trim();
    const snippetTitle = this.editSnippetTitle.trim();
    const githubLink = this.editGithubLink.trim();

    if (!title || !description || !snippetContent || !snippetLanguage) {
      this.editError.set('Please fill the required fields.');
      return;
    }

    this.editSaving.set(true);
    this.editError.set(null);

    this.postsService.updatePost(this.post.id, {
      title,
      description,
      snippetContent,
      snippetLanguage,
      snippetTitle: snippetTitle ? snippetTitle : undefined,
      githubLink: githubLink ? githubLink : undefined,
    }).subscribe({
      next: (updated) => {
        this.post = updated;
        this.editSaving.set(false);
        this.editModalOpen.set(false);
        this.showToast('Updated');
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to update post';
        this.editError.set(typeof message === 'string' ? message : 'Failed to update post');
        this.editSaving.set(false);
      },
    });
  }

  confirmDelete(event: MouseEvent) {
    event.stopPropagation();
    if (this.deleting()) return;

    this.deleting.set(true);

    this.postsService.deletePost(this.post.id).subscribe({
      next: () => {
        this.hidden.set(true);
        this.confirmDeleteOpen.set(false);
        this.deleting.set(false);
        this.showToast('Deleted');
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to delete post';
        this.deleting.set(false);
        this.showToast(typeof message === 'string' ? message : 'Failed to delete post');
      },
    });
  }

  toggleSaveMenu(event: MouseEvent) {
    event.stopPropagation();
    this.saveMenuOpen.update((open) => !open);
    if (this.saveMenuOpen() && this.collections().length === 0) {
      this.loadCollections();
    }
  }

  loadCollections() {
    if (this.collectionsLoading()) return;
    this.collectionsLoading.set(true);

    this.collectionsService.getCollections({ page: 1, size: 100 }).subscribe({
      next: (res) => {
        this.collections.set(res.collections ?? []);
        this.collectionsLoading.set(false);
      },
      error: () => {
        this.collectionsLoading.set(false);
      },
    });
  }

  saveToDefaultCollection() {
    this.ensureDefaultSavedPostsCollectionId().then((collectionId) => {
      if (!collectionId) {
        this.showToast('Save failed');
        return;
      }
      this.savePostToCollection(collectionId);
    });
  }

  savePostToCollection(collectionId: number) {
    if (this.savingToCollection()) return;
    this.savingToCollection.set(true);

    this.collectionsService.addItem(collectionId, {
      targetId: this.post.id,
      targetType: 'POST',
    }).subscribe({
      next: () => {
        this.savingToCollection.set(false);
        this.saveMenuOpen.set(false);
        this.showToast('Saved');
      },
      error: () => {
        this.savingToCollection.set(false);
        this.saveMenuOpen.set(false);
        this.showToast('Already saved');
      },
    });
  }

  private async ensureDefaultSavedPostsCollectionId(): Promise<number | null> {
    const normalize = (name?: string | null) => (name ?? '').trim().toLowerCase();

    // If collections were never loaded, load them first.
    if (this.collections().length === 0) {
      await new Promise<void>((resolve) => {
        this.collectionsService.getCollections({ page: 1, size: 100 }).subscribe({
          next: (res) => {
            this.collections.set(res.collections ?? []);
            resolve();
          },
          error: () => resolve(),
        });
      });
    }

    const desiredName = this.defaultSavedItemsCollectionName;
    const desired = this.collections().find((c) => normalize(c.name) === normalize(desiredName));
    if (desired) return desired.id;

    const legacy = this.collections().find((c) =>
      this.legacyDefaultCollectionNames.some((legacyName) => normalize(c.name) === normalize(legacyName))
    );

    if (legacy) {
      // Rename legacy default collection to the new shared name.
      await new Promise<void>((resolve) => {
        this.collectionsService.updateCollection(legacy.id, { name: desiredName }).subscribe({
          next: () => {
            this.collections.update((current) =>
              current.map((c) => (c.id === legacy.id ? { ...c, name: desiredName } : c))
            );
            resolve();
          },
          error: () => resolve(),
        });
      });
      return legacy.id;
    }

    // Create the shared default collection when it doesn't exist.
    return await new Promise<number | null>((resolve) => {
      this.collectionsService.createCollection({ name: desiredName }).subscribe({
        next: (created) => {
          this.collections.update((current) => [created, ...current]);
          resolve(created.id);
        },
        error: () => resolve(null),
      });
    });
  }

  openCommentsModal() {
    this.commentsModalOpen.set(true);
    if (this.comments().length === 0) {
      this.loadCommentsPage(1);
    }

    // Wait a tick for the modal DOM to render before attaching the observer.
    setTimeout(() => this.setupCommentsInfiniteScroll());
  }

  closeCommentsModal() {
    this.commentsModalOpen.set(false);
    this.commentError.set(null);
    this.commentsObserver?.disconnect();
    this.commentsObserver = undefined;
  }

  private setupCommentsInfiniteScroll() {
    this.commentsObserver?.disconnect();

    const rootEl = this.commentsScroll?.nativeElement;
    const sentinelEl = this.commentsSentinel?.nativeElement;
    if (!rootEl || !sentinelEl) return;

    this.commentsObserver = new IntersectionObserver(
      (entries) => {
        const isNearEnd = entries.some((e) => e.isIntersecting);
        if (!isNearEnd) return;
        if (this.commentsLoading() || this.commentsLoadingMore()) return;
        if (this.commentsPage() >= this.commentsTotalPages()) return;
        this.loadMoreComments();
      },
      {
        root: rootEl,
        rootMargin: '200px 0px',
        threshold: 0,
      }
    );

    this.commentsObserver.observe(sentinelEl);
  }

  loadCommentsPage(page: number) {
    if (this.commentsLoading()) return;
    this.commentsLoading.set(true);

    this.commentsService.getPostComments(this.post.id, page, this.commentsLimit).subscribe({
      next: (res) => {
        this.comments.set(res.data);
        this.commentsPage.set(res.page);
        this.commentsTotalPages.set(res.totalPages);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.commentsLoading.set(false);
      },
    });
  }

  loadMoreComments() {
    if (this.commentsLoadingMore() || this.commentsLoading()) return;

    const nextPage = this.commentsPage() + 1;
    if (nextPage > this.commentsTotalPages()) return;

    this.commentsLoadingMore.set(true);

    this.commentsService.getPostComments(this.post.id, nextPage, this.commentsLimit).subscribe({
      next: (res) => {
        this.comments.update((current) => [...current, ...res.data]);
        this.commentsPage.set(res.page);
        this.commentsTotalPages.set(res.totalPages);
        this.commentsLoadingMore.set(false);
      },
      error: () => {
        this.commentsLoadingMore.set(false);
      },
    });
  }

  submitComment() {
    const content = this.commentInput().trim();
    if (!content) return;

    this.submittingComment.set(true);
    this.commentError.set(null);

    this.commentsService.createPostComment(this.post.id, { content }).subscribe({
      next: (created) => {
        this.comments.update((current) => [created, ...current]);
        this.commentInput.set('');
        this.submittingComment.set(false);

        // Keep UI consistent with backend tweaks
        this.post.commentsCount = (this.post.commentsCount ?? 0) + 1;

        // Keep pagination state sensible after a new comment
        if (this.commentsPage() === 0) this.commentsPage.set(1);

        this.showToast('Comment added');
      },
      error: () => {
        this.commentError.set('Failed to add comment');
        this.submittingComment.set(false);
      },
    });
  }

  async copyCode() {
    const code = this.post.snippet?.content ?? '';
    try {
      await navigator.clipboard.writeText(code);
      this.showToast('Copied');
    } catch {
      this.showToast('Copy failed');
    }
  }

  openFullscreen() {
    this.fullscreen.set(true);
  }

  closeFullscreen() {
    this.fullscreen.set(false);
  }

  toggleReactionsMenu(event: MouseEvent) {
    event.stopPropagation();
    this.reactionsMenuOpen.update((open) => !open);
  }

  chooseReaction(type: ReactionType) {
    const interactions = this.post.interactions;
    if (!interactions) return;

    // Toggle off when clicking the same reaction.
    if (interactions.myType === type) {
      (interactions as any)[type] = Math.max(0, ((interactions as any)[type] ?? 0) - 1);
      interactions.total = Math.max(0, (interactions.total ?? 0) - 1);
      interactions.myType = null;
      interactions.didInteract = false;

      this.interactionsService.unreact('POST', this.post.id).subscribe({
        next: () => {
          // No-op: optimistic state is fine
        },
        error: () => {
          // Roll back on error
          (interactions as any)[type] = ((interactions as any)[type] ?? 0) + 1;
          interactions.total = (interactions.total ?? 0) + 1;
          interactions.myType = type;
          interactions.didInteract = true;
          this.showToast('Reaction remove failed');
        },
      });

      this.reactionsMenuOpen.set(false);
      return;
    }

    this.react(type);
    this.reactionsMenuOpen.set(false);
  }

  react(type: ReactionType) {
    const interactions = this.post.interactions;
    if (!interactions) return;

    // One emoji at a time; clicking the same one does nothing.
    if (interactions.myType === type) return;

    const previous = interactions.myType;

    // Optimistic update
    if (previous) {
      (interactions as any)[previous] = Math.max(0, ((interactions as any)[previous] ?? 0) - 1);
      interactions.total = Math.max(0, (interactions.total ?? 0) - 1);
    }

    (interactions as any)[type] = ((interactions as any)[type] ?? 0) + 1;
    interactions.total = (interactions.total ?? 0) + 1;
    interactions.myType = type;
    interactions.didInteract = true;

    this.interactionsService
      .react({ targetType: 'POST', targetId: this.post.id, type })
      .subscribe({
        next: () => {
          // No-op: optimistic state is fine
        },
        error: () => {
          // Roll back on error
          if (previous) {
            (interactions as any)[previous] = ((interactions as any)[previous] ?? 0) + 1;
            interactions.total = (interactions.total ?? 0) + 1;
          }
          (interactions as any)[type] = Math.max(0, ((interactions as any)[type] ?? 0) - 1);
          interactions.total = Math.max(0, (interactions.total ?? 0) - 1);
          interactions.myType = previous ?? null;
          interactions.didInteract = Boolean(previous);

          this.showToast('Reaction failed');
        },
      });
  }

  reactionCount(type: ReactionType): number {
    const interactions = this.post.interactions as any;
    return Number(interactions?.[type] ?? 0);
  }

  totalReactions(): number {
    return this.reactionTypes.reduce((sum, type) => sum + this.reactionCount(type), 0);
  }

  visibleReactionTypes(): ReactionType[] {
    return this.reactionTypes.filter((type) => this.reactionCount(type) > 0);
  }

  reactionMeta(type: ReactionType): { icon: string; emoji: string; label: string } {
    switch (type) {
      case 'HEART':
        return { icon: 'favorite', emoji: '❤️', label: 'Heart' };
      case 'HELPFUL':
        return { icon: 'lightbulb', emoji: '💡', label: 'Helpful' };
      case 'FIRE':
        return { icon: 'local_fire_department', emoji: '🔥', label: 'Fire' };
      case 'FUNNY':
        return { icon: 'sentiment_satisfied', emoji: '😂', label: 'Funny' };
      case 'INCORRECT':
        return { icon: 'cancel', emoji: '❌', label: 'Incorrect' };
    }
  }

  private showToast(message: string) {
    this.toast.set(message);
    setTimeout(() => {
      if (this.toast() === message) this.toast.set(null);
    }, 1200);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  authorInitials(): string {
    const name = (this.post?.author?.fullName ?? this.post?.author?.username ?? '').trim();
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  }
}
