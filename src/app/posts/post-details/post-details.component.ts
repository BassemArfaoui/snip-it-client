import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostsService, type Post } from '../../services/posts.service';
import { CommentsService, type Comment } from '../../services/comments.service';
import { TimeAgoPipe } from '../../time-ago.pipe';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
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

  authorInitials(): string {
    const name = this.post?.author?.fullName || this.post?.author?.username || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
