import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsService, type Post } from '../services/posts.service';
import { PostCardComponent } from './components/post-card/post-card.component';

@Component({
  selector: 'snip-it-dashboard',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly pageSize = 10;

  readonly posts = signal<Post[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly page = signal(1);
  readonly totalPages = signal<number | null>(null);

  readonly canLoadMore = computed(() => {
    const total = this.totalPages();
    if (total === null) return true;
    return this.page() < total;
  });

  constructor(private readonly postsService: PostsService) {
    this.loadFirstPage();
  }

  loadFirstPage() {
    this.posts.set([]);
    this.page.set(1);
    this.totalPages.set(null);
    this.loadMore();
  }

  loadMore() {
    if (this.loading()) return;
    if (!this.canLoadMore()) return;

    this.loading.set(true);
    this.error.set(null);

    const page = this.page();
    this.postsService.getPosts(page, this.pageSize).subscribe({
      next: (res) => {
        this.posts.update((current) => [...current, ...res.data]);
        this.totalPages.set(res.totalPages);
        this.page.set(page + 1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load posts. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
