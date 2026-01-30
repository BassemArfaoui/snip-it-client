import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService, type Post } from '../../services/posts.service';
import { CommentsService, type Comment } from '../../services/comments.service';
import { TimeAgoPipe } from '../../time-ago.pipe';
import { userId } from '../../auth.store';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TimeAgoPipe],
  templateUrl: './post-details.component.html',
})
export class PostDetailsComponent {
  post: Post | null = null;
  loadingPost = false;
  postError: string | null = null;

  comments: Comment[] = [];
  commentsLoading = false;
  commentsLoadingMore = false;
  commentsPage = 1;
  commentsTotalPages = 1;
  readonly commentsLimit = 10;

  commentMoreOpenId: number | null = null;

  editCommentOpen = false;
  editCommentId: number | null = null;
  editCommentContent = '';
  editCommentSaving = false;
  editCommentError: string | null = null;

  confirmCommentDeleteOpen = false;
  commentDeleteId: number | null = null;
  commentDeleting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.post = null;
        this.postError = 'Invalid post id';
        return;
      }
      this.loadPost(id);
      this.loadCommentsFirstPage(id);
    });
  }

  private loadPost(postId: number) {
    this.loadingPost = true;
    this.postError = null;

    this.postsService.getPostById(postId).subscribe({
      next: (post) => {
        this.post = post;
        this.loadingPost = false;
      },
      error: (err) => {
        this.loadingPost = false;
        this.post = null;
        this.postError = err?.error?.message || 'Failed to load post';
      },
    });
  }

  private loadCommentsFirstPage(postId: number) {
    if (this.commentsLoading) return;

    this.commentsLoading = true;
    this.commentsPage = 1;
    this.commentsTotalPages = 1;
    this.comments = [];

    this.commentsService.getPostComments(postId, 1, this.commentsLimit).subscribe({
      next: (res) => {
        this.comments = res.data;
        this.commentsPage = res.page;
        this.commentsTotalPages = res.totalPages;
        this.commentsLoading = false;
      },
      error: () => {
        this.commentsLoading = false;
      },
    });
  }

  loadMoreComments() {
    const postId = this.post?.id;
    if (!postId) return;
    if (this.commentsLoadingMore || this.commentsLoading) return;

    const nextPage = this.commentsPage + 1;
    if (nextPage > this.commentsTotalPages) return;

    this.commentsLoadingMore = true;

    this.commentsService.getPostComments(postId, nextPage, this.commentsLimit).subscribe({
      next: (res) => {
        this.comments = [...this.comments, ...res.data];
        this.commentsPage = res.page;
        this.commentsTotalPages = res.totalPages;
        this.commentsLoadingMore = false;
      },
      error: () => {
        this.commentsLoadingMore = false;
      },
    });
  }

  get hasMoreComments(): boolean {
    return this.commentsPage < this.commentsTotalPages;
  }

  isOwnComment(c: Comment): boolean {
    const me = userId();
    return !!me && me === c.user.id;
  }

  toggleCommentMore(commentId: number, event: MouseEvent) {
    event.stopPropagation();
    this.commentMoreOpenId = this.commentMoreOpenId === commentId ? null : commentId;
  }

  closeCommentMore(event?: MouseEvent) {
    event?.stopPropagation();
    this.commentMoreOpenId = null;
  }

  openEditComment(c: Comment, event: MouseEvent) {
    event.stopPropagation();
    this.closeCommentMore();

    this.editCommentError = null;
    this.editCommentId = c.id;
    this.editCommentContent = c.content ?? '';
    this.editCommentOpen = true;
  }

  closeEditComment(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.editCommentSaving) return;
    this.editCommentOpen = false;
    this.editCommentId = null;
    this.editCommentContent = '';
    this.editCommentError = null;
  }

  saveCommentEdit(event: MouseEvent) {
    event.stopPropagation();

    const id = this.editCommentId;
    if (!id) return;
    if (this.editCommentSaving) return;

    const content = this.editCommentContent.trim();
    if (!content) {
      this.editCommentError = 'Comment cannot be empty.';
      return;
    }

    this.editCommentSaving = true;
    this.editCommentError = null;

    this.commentsService.updateComment(id, { content }).subscribe({
      next: (updated) => {
        this.comments = this.comments.map((c) =>
          c.id === updated.id ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c
        );
        this.editCommentSaving = false;
        this.editCommentOpen = false;
        this.editCommentId = null;
        this.editCommentContent = '';
      },
      error: (err) => {
        this.editCommentSaving = false;
        this.editCommentError = err?.error?.message || 'Failed to update comment';
      },
    });
  }

  openDeleteCommentConfirm(c: Comment, event: MouseEvent) {
    event.stopPropagation();
    this.closeCommentMore();
    this.confirmCommentDeleteOpen = true;
    this.commentDeleteId = c.id;
  }

  closeDeleteCommentConfirm(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.commentDeleting) return;
    this.confirmCommentDeleteOpen = false;
    this.commentDeleteId = null;
  }

  confirmDeleteComment(event: MouseEvent) {
    event.stopPropagation();
    const id = this.commentDeleteId;
    if (!id) return;
    if (this.commentDeleting) return;

    this.commentDeleting = true;

    this.commentsService.deleteComment(id).subscribe({
      next: () => {
        this.comments = this.comments.filter((c) => c.id !== id);
        if (this.post) {
          this.post = { ...this.post, commentsCount: Math.max(0, (this.post.commentsCount ?? 0) - 1) };
        }
        this.commentDeleting = false;
        this.confirmCommentDeleteOpen = false;
        this.commentDeleteId = null;
      },
      error: (err) => {
        this.commentDeleting = false;
        // keep it simple for now
        console.error(err);
      },
    });
  }

  authorInitials(): string {
    const name = this.post?.author?.fullName || this.post?.author?.username || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
