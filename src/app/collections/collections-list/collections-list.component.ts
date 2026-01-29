import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollectionsService, Collection, CreateCollectionDto } from '../../services/collections.service';
import { TagsService, Tag } from '../../services/tags.service';

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
  
  // Edit modal state
  showEditModal = signal(false);
  editingCollection = signal<Collection | null>(null);
  editCollectionName = signal('');
  editCollectionPublic = signal(false);
  editCollectionAllowEdit = signal(false);
  
  // Tag filtering
  availableTags = signal<Tag[]>([]);
  selectedTags = signal<number[]>([]);

  // Computed signal for filtered collections
  filteredCollections = computed(() => {
    const collections = this.collections();
    const query = this.searchQuery().toLowerCase();
    const filter = this.selectedFilter();
    const sort = this.sortBy();
    const selectedTagIds = new Set(this.selectedTags());

    let filtered = collections.filter(c => {
      if (query && !c.name.toLowerCase().includes(query)) return false;
      if (filter === 'Public' && !c.isPublic) return false;
      if (filter === 'Private' && c.isPublic) return false;
      
      // Filter by tags: if tags are selected, collection must have at least one selected tag
      if (this.selectedTags().length > 0) {
        const collectionTagIds = new Set((c.tags || []).map(t => t.id));
        const hasAnySelectedTag = Array.from(selectedTagIds).every(tagId => collectionTagIds.has(tagId));
        if (!hasAnySelectedTag) return false;
      }
      
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
    private tagsService: TagsService,
    private router: Router
  ) {
    // Re-load collections whenever selected tags change
    effect(() => {
      const selectedTagIds = this.selectedTags();
      if (selectedTagIds !== undefined) {
        this.currentPage.set(1);
        this.loadCollections();
      }
    });
  }

  ngOnInit(): void {
    this.loadAvailableTags();
    this.loadCollections();
  }
  
  loadAvailableTags(): void {
    this.tagsService.getTags({ size: 100 }).subscribe({
      next: (result) => this.availableTags.set(result.tags),
      error: (err) => console.error('Failed to load tags', err)
    });
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

  toggleTagFilter(tagId: number): void {
    const currentTags = this.selectedTags();
    if (currentTags.includes(tagId)) {
      this.selectedTags.set(currentTags.filter(id => id !== tagId));
    } else {
      this.selectedTags.set([...currentTags, tagId]);
    }
  }

  clearTagFilters(): void {
    this.selectedTags.set([]);
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

  openEditModal(event: Event, collection: Collection): void {
    event.stopPropagation();
    this.editingCollection.set(collection);
    this.editCollectionName.set(collection.name);
    this.editCollectionPublic.set(collection.isPublic);
    this.editCollectionAllowEdit.set(collection.allowEdit);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingCollection.set(null);
  }

  updateCollection(): void {
    const collection = this.editingCollection();
    if (!collection || !this.editCollectionName().trim()) return;
    
    const dto: Partial<CreateCollectionDto> = {
      name: this.editCollectionName(),
      isPublic: this.editCollectionPublic(),
      allowEdit: this.editCollectionAllowEdit()
    };
    
    this.collectionsService.updateCollection(collection.id, dto).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadCollections();
      },
      error: (err) => {
        this.error.set('Failed to update collection');
        console.error(err);
      }
    });
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
    const name = collection.name.toLowerCase();
    if (name.includes('react')) return 'code';
    if (name.includes('python')) return 'terminal';
    if (name.includes('css')) return 'palette';
    if (name.includes('design')) return 'palette';
    if (name.includes('api')) return 'api';
    if (name.includes('legacy')) return 'inventory_2';
    return 'folder';
  }
}
