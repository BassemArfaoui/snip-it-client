import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentsService, type Comment } from '../../../services/comments.service';
import { InteractionsService } from '../../../services/interactions.service';
import { type Post, type ReactionType } from '../../../services/posts.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-card.component.html',
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  readonly reactionTypes: ReactionType[] = ['HEART', 'HELPFUL', 'FIRE', 'FUNNY', 'INCORRECT'];

  readonly commentsModalOpen = signal(false);
  readonly commentsLoading = signal(false);
  readonly comments = signal<Comment[]>([]);
  readonly commentInput = signal('');
  readonly commentError = signal<string | null>(null);
  readonly submittingComment = signal(false);

  readonly fullscreen = signal(false);
  readonly toast = signal<string | null>(null);

  constructor(
    private readonly commentsService: CommentsService,
    private readonly interactionsService: InteractionsService,
  ) {}

  openCommentsModal() {
    this.commentsModalOpen.set(true);
    if (this.comments().length === 0) {
      this.loadComments();
    }
  }

  closeCommentsModal() {
    this.commentsModalOpen.set(false);
    this.commentError.set(null);
  }

  loadComments() {
    if (this.commentsLoading()) return;
    this.commentsLoading.set(true);

    this.commentsService.getPostComments(this.post.id, 1, 10).subscribe({
      next: (res) => {
        this.comments.set(res.data);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.commentsLoading.set(false);
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

  authorInitials(): string {
    const name = (this.post?.author?.username ?? '').trim();
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  }
}
