import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionsService, Collection, CollectionItem } from '../../services/collections.service';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.css']
})
export class CollectionDetailComponent implements OnInit {
  // Signals
  collectionId = signal<number | null>(null);
  collection = signal<Collection | null>(null);
  items = signal<CollectionItem[]>([]);
  loading = signal(false);
  error = signal('');
  selectedTab = signal<'All Items' | 'Snippets' | 'Issues' | 'Solutions'>('All Items');
  searchQuery = signal('');
  selectedLanguage = signal('All');
  sortBy = signal('Last Modified');
  currentPage = signal(1);
  pageSize = 20;
  totalItems = signal(0);

  // Stats
  stats = signal({
    items: 0,
    issues: 0,
    views: 0,
    forks: 0
  });

  tabs: Array<'All Items' | 'Snippets' | 'Issues' | 'Solutions'> = ['All Items', 'Snippets', 'Issues', 'Solutions'];
  languages = ['All', 'JavaScript', 'Python', 'TypeScript', 'CSS', 'Java'];

  constructor(
    private collectionsService: CollectionsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.collectionId.set(+params['id']);
      this.loadCollection();
      this.loadItems();
    });
  }

  loadCollection(): void {
    const id = this.collectionId();
    if (!id) return;
    
    this.collectionsService.getCollectionById(id).subscribe({
      next: (collection) => {
        this.collection.set(collection);
      },
      error: (err) => {
        this.error.set('Failed to load collection');
        console.error(err);
      }
    });
  }

  loadItems(): void {
    const id = this.collectionId();
    if (!id) return;
    
    this.loading.set(true);
    this.error.set('');
    
    this.collectionsService.getCollectionItems(id, {
      page: this.currentPage(),
      size: this.pageSize,
      q: this.searchQuery() || undefined,
      language: this.selectedLanguage() !== 'All' ? this.selectedLanguage() : undefined,
      sort: this.sortBy()
    }).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.totalItems.set(response.total);
        this.updateStats();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load items');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  updateStats(): void {
    const itemsList = this.items();
    this.stats.set({
      items: itemsList.length,
      issues: itemsList.filter(i => i.targetType === 'issue').length,
      views: Math.floor(Math.random() * 2000) + 100,
      forks: Math.floor(Math.random() * 20)
    });
  }

  setTab(tab: 'All Items' | 'Snippets' | 'Issues' | 'Solutions'): void {
    this.selectedTab.set(tab);
  }

  setLanguage(language: string): void {
    this.selectedLanguage.set(language);
    this.loadItems();
  }

  setSortBy(sort: string): void {
    this.sortBy.set(sort);
    this.loadItems();
  }

  onSearchChange(): void {
    // No need to filter manually - template will use signals
  }

  removeItem(event: Event, item: CollectionItem): void {
    event.stopPropagation();
    
    const id = this.collectionId();
    if (!id) return;
    if (!confirm('Remove this item from the collection?')) return;
    
    this.collectionsService.removeItem(id, item.targetId, item.targetType).subscribe({
      next: () => {
        this.loadItems();
      },
      error: (err) => {
        this.error.set('Failed to remove item');
        console.error(err);
      }
    });
  }

  toggleFavorite(event: Event, item: CollectionItem): void {
    event.stopPropagation();
    
    const id = this.collectionId();
    if (!id) return;
    
    this.collectionsService.toggleFavorite(
      id,
      item.targetId,
      item.targetType,
      !item.isFavorite
    ).subscribe({
      next: () => {
        item.isFavorite = !item.isFavorite;
      },
      error: (err) => {
        this.error.set('Failed to toggle favorite');
        console.error(err);
      }
    });
  }  openItem(item: CollectionItem): void {
    // Navigate to the appropriate detail page based on type
    if (item.targetType === 'snippet' || item.targetType === 'private-snippet') {
      this.router.navigate(['/snippets', item.targetId]);
    } else if (item.targetType === 'post') {
      this.router.navigate(['/posts', item.targetId]);
    }
  }

  shareCollection(): void {
    const id = this.collectionId();
    if (!id) return;
    
    this.collectionsService.generateShareLink(id, 'view', 30).subscribe({
      next: (response) => {
        navigator.clipboard.writeText(response.url);
        alert('Share link copied to clipboard!');
      },
      error: (err) => {
        this.error.set('Failed to generate share link');
        console.error(err);
      }
    });
  }

  addNewItem(): void {
    // This would open a modal or navigate to create snippet/post
    alert('Add item functionality - to be implemented');
  }

  goBack(): void {
    this.router.navigate(['/collections']);
  }

  getItemIcon(type: string): string {
    switch(type) {
      case 'snippet':
      case 'private-snippet':
        return '💾';
      case 'post':
        return '📝';
      case 'issue':
        return '🔴';
      case 'solution':
        return '✅';
      default:
        return '📄';
    }
  }

  getItemBadgeColor(type: string): string {
    switch(type) {
      case 'snippet':
      case 'private-snippet':
        return 'bg-blue-900/30 text-blue-400';
      case 'post':
        return 'bg-green-900/30 text-green-400';
      case 'issue':
        return 'bg-red-900/30 text-red-400';
      case 'solution':
        return 'bg-purple-900/30 text-purple-400';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  }

  getPriorityBadge(item: CollectionItem): string | null {
    // Check if item has priority metadata
    if (item.content?.priority === 'high') return 'HIGH PRIORITY';
    return null;
  }
}
