import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionsService, Collection, CreateCollectionDto } from '../../services/collections.service';

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.css']
})
export class CollectionsListComponent implements OnInit {
  // Signals
  collections = signal<Collection[]>([]);
  loading = signal(false);
  error = signal('');
  searchQuery = signal('');
  selectedFilter = signal('All');
  sortBy = signal('Recent');
  showCreateModal = signal(false);
  currentPage = signal(1);
  totalCollections = signal(0);
  
  // Form state signals
  newCollectionName = signal('');
  newCollectionPublic = signal(false);
  newCollectionAllowEdit = signal(false);

  // Computed signal for filtered collections
  filteredCollections = computed(() => {
    const collections = this.collections();
    const query = this.searchQuery().toLowerCase();
    const filter = this.selectedFilter();
    const sort = this.sortBy();

    let filtered = collections.filter(c => {
      if (query && !c.name.toLowerCase().includes(query)) return false;
      if (filter === 'Public' && !c.isPublic) return false;
      if (filter === 'Private' && c.isPublic) return false;
      return true;
    });

    if (sort === 'Recent') {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sort === 'Name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  });

  pageSize = 12;

  constructor(
    private collectionsService: CollectionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCollections();
  }

  loadCollections(): void {
    this.loading.set(true);
    this.error.set('');
    
    this.collectionsService.getCollections({
      page: this.currentPage(),
      size: this.pageSize,
      q: this.searchQuery() || undefined
    }).subscribe({
      next: (response) => {
        this.collections.set(response.collections);
        this.totalCollections.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load collections');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onSearchChange(): void {
    // Computed signal automatically updates
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  setSortBy(sort: string): void {
    this.sortBy.set(sort);
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.newCollectionName.set('');
    this.newCollectionPublic.set(false);
    this.newCollectionAllowEdit.set(false);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createCollection(): void {
    if (!this.newCollectionName().trim()) return;
    
    const dto: CreateCollectionDto = {
      name: this.newCollectionName(),
      isPublic: this.newCollectionPublic(),
      allowEdit: this.newCollectionAllowEdit()
    };
    
    this.collectionsService.createCollection(dto).subscribe({
      next: (collection) => {
        this.closeCreateModal();
        this.loadCollections();
      },
      error: (err) => {
        this.error.set('Failed to create collection');
        console.error(err);
      }
    });
  }

  openCollection(collection: Collection): void {
    this.router.navigate(['/collections', collection.id]);
  }

  deleteCollection(event: Event, collection: Collection): void {
    event.stopPropagation();
    
    if (!confirm(`Delete "${collection.name}"?`)) return;
    
    this.collectionsService.deleteCollection(collection.id).subscribe({
      next: () => {
        this.loadCollections();
      },
      error: (err) => {
        this.error.set('Failed to delete collection');
        console.error(err);
      }
    });
  }

  getCollectionIcon(collection: Collection): string {
    // Return emoji based on collection name or type
    const name = collection.name.toLowerCase();
    if (name.includes('react')) return '⚛️';
    if (name.includes('python')) return '🐍';
    if (name.includes('css')) return '🎨';
    if (name.includes('design')) return '🎨';
    if (name.includes('api')) return '🔌';
    if (name.includes('legacy')) return '📦';
    return '📁';
  }
}
