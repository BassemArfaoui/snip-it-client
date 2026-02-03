import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
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

  posts = signal<Post[]>([]);
  issues = signal<Issue[]>([]);
  postsError = signal('');
  issuesError = signal('');
  @Input() counts: { posts?: number; issues?: number } | null = null;
  postsLoading = signal(false);
  issuesLoading = signal(false);

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
    this.postsLoading.set(true);
    this.postsError.set('');
    this.profileService.getUserPosts(this.userId).subscribe({
      next: (data) => {
        this.posts.set(data || []);
        this.postsLoading.set(false);
        this.postsError.set('');
        this.counts = { posts: this.posts().length, issues: this.counts?.issues ?? 0 };
      },
      error: (err) => {
        console.error('Feed posts error:', err);
        this.posts.set([]);
        this.postsLoading.set(false);
        const status = err?.status;
        if (status === 404) this.postsError.set('User not found');
        else if (status === 403) this.postsError.set('Access denied');
        else this.postsError.set(err?.error?.message || 'Failed to load posts');
      }
    });
  }

  loadIssues(): void {
    if (!this.userId) return;
    this.issuesLoading.set(true);
    this.issuesError.set('');
    this.profileService.getUserIssues(this.userId).subscribe({
      next: (data) => {
        this.issues.set(data || []);
        this.issuesLoading.set(false);
        this.issuesError.set('');
        this.counts = { issues: this.issues().length, posts: this.counts?.posts ?? 0 };
      },
      error: (err) => {
        console.error('Feed issues error:', err);
        this.issues.set([]);
        this.issuesLoading.set(false);
        const status = err?.status;
        if (status === 404) this.issuesError.set('User not found');
        else if (status === 403) this.issuesError.set('Access denied');
        else this.issuesError.set(err?.error?.message || 'Failed to load issues');
      }
    });
  }
}
