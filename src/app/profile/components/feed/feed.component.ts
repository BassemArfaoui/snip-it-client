import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post, Issue } from '../../../services/profile.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-profile-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feed.component.html'
})
export class FeedComponent {
  @Input() activeTab: 'posts' | 'issues' = 'posts';
  @Input() userId?: number;

  posts: Post[] = [];
  issues: Issue[] = [];
  postsError = '';
  issuesError = '';
  @Input() counts: { posts?: number; issues?: number } | null = null;
  postsLoading = false;
  issuesLoading = false;

  @Output() changeTab = new EventEmitter<'posts'|'issues'>();
  @Output() reloadPosts = new EventEmitter<void>();
  @Output() reloadIssues = new EventEmitter<void>();

  constructor(private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId) {
      // load the currently active tab data when userId becomes available
      if (this.activeTab === 'posts') this.loadPosts();
      if (this.activeTab === 'issues') this.loadIssues();
    }

    if (changes['activeTab']) {
      if (this.activeTab === 'posts') this.loadPosts();
      if (this.activeTab === 'issues') this.loadIssues();
    }
  }

  loadPosts(): void {
    if (!this.userId) return;
    this.postsLoading = true;
    this.postsError = '';
    this.profileService.getUserPosts(this.userId).subscribe({
      next: (data) => {
        this.posts = data || [];
        this.postsLoading = false;
        this.postsError = '';
        this.counts = { posts: this.posts.length, issues: this.counts?.issues ?? 0 };
      },
      error: (err) => {
        console.error('Feed posts error:', err);
        this.posts = [];
        this.postsLoading = false;
        const status = err?.status;
        if (status === 404) this.postsError = 'User not found';
        else if (status === 403) this.postsError = 'Access denied';
        else this.postsError = err?.error?.message || 'Failed to load posts';
      }
    });
  }

  loadIssues(): void {
    if (!this.userId) return;
    this.issuesLoading = true;
    this.issuesError = '';
    this.profileService.getUserIssues(this.userId).subscribe({
      next: (data) => {
        this.issues = data || [];
        this.issuesLoading = false;
        this.issuesError = '';
        this.counts = { issues: this.issues.length, posts: this.counts?.posts ?? 0 };
      },
      error: (err) => {
        console.error('Feed issues error:', err);
        this.issues = [];
        this.issuesLoading = false;
        const status = err?.status;
        if (status === 404) this.issuesError = 'User not found';
        else if (status === 403) this.issuesError = 'Access denied';
        else this.issuesError = err?.error?.message || 'Failed to load issues';
      }
    });
  }
}
