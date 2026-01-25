import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionsService, Collection, CollectionItem } from '../../services/collections.service';
import { Tag, TagsService } from '../../services/tags.service';
import { TimeAgoPipe } from '../../time-ago.pipe';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.css']
})
export class CollectionDetailComponent implements OnInit {
  // Signals
  collectionId = signal<number | null>(null);
  collectionToken = signal<string | null>(null);
  collection = signal<Collection | null>(null);
  items = signal<CollectionItem[]>([]);
  loading = signal(false);
  error = signal('');
  selectedTab = signal<'All Items' | 'Posts'  | 'Snippets' | 'Issues' | 'Solutions'>('All Items');
  searchQuery = signal('');
  selectedLanguage = signal('All');
  sortBy = signal('Last Modified');
  currentPage = signal(1);
  pageSize = 20;
  totalItems = signal(0);

  // Tag state
  availableTags = signal<Tag[]>([]);
  collectionTags = signal<Tag[]>([]);
  showTagModal = signal(false);
  tagModalStep = signal<'select' | 'create'>('select'); // 'select' or 'create'
  tagSearch = signal('');
  newTagName = signal('');
  newTagColor = signal('#ffe500');
  filteredTags = computed(() => {
    const term = this.tagSearch().toLowerCase();
    const assignedIds = new Set(this.collectionTags().map(t => t.id));
    return this.availableTags()
      .filter(t => !assignedIds.has(t.id))
      .filter(t => !term || t.name.toLowerCase().includes(term));
  });

  // Edit modal state
  showEditModal = signal(false);
  editCollectionName = signal('');
  editCollectionPublic = signal(false);
  editCollectionAllowEdit = signal(false);

  // Share confirmation modal state
  showShareConfirmModal = signal(false);
  isGeneratingShareLink = signal(false);

  // Move item modal state
  showMoveModal = signal(false);
  itemToMove = signal<CollectionItem | null>(null);
  destinationCollectionId = signal<number | null>(null);
  userCollections = signal<Collection[]>([]);
  loadingCollections = signal(false);

  // Stats
  stats = signal({
    items: 0,
    issues: 0,
    views: 0,
    forks: 0
  });

  tabs: Array<'All Items' | 'Posts'  | 'Snippets' | 'Issues' | 'Solutions'> = ['All Items','Posts', 'Snippets', 'Issues', 'Solutions'];
  languages = ['All', 'JavaScript', 'Python', 'TypeScript', 'CSS', 'Java'];

  constructor(
    private collectionsService: CollectionsService,
    private tagsService: TagsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['token']) {
        // Loading via share token
        this.collectionToken.set(params['token']);
        this.collectionId.set(null);
        // Only load collection - items will be loaded after we get the collection ID
        this.loadCollection();
      } else if (params['id']) {
        // Loading via collection ID
        this.collectionId.set(+params['id']);
        this.collectionToken.set(null);
        // Load everything normally
        this.loadCollection();
        this.loadItems();
        this.loadCollectionTags();
        this.loadAvailableTags();
      }
    });
  }

  loadCollection(): void {
    const id = this.collectionId();
    const token = this.collectionToken();
    
    let request: any;
    if (token) {
      request = this.collectionsService.getCollectionByToken(token);
    } else if (id) {
      request = this.collectionsService.getCollectionById(id);
    } else {
      return;
    }
    
    request.subscribe({
      next: (collection: Collection) => {
        this.collection.set(collection);
        // Set the collection ID if we loaded via token
        if (token && collection.id) {
          this.collectionId.set(collection.id);
          // Now load items, tags, etc. after we have the ID
          this.loadItems();
          this.loadCollectionTags();
          this.loadAvailableTags();
        }
        if (collection.tags) {
          this.collectionTags.set(collection.tags);
        }
      },
      error: (err: any) => {
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

  loadCollectionTags(): void {
    const id = this.collectionId();
    if (!id) return;

    this.collectionsService.getCollectionTags(id).subscribe({
      next: (tags) => this.collectionTags.set(tags || []),
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadAvailableTags(): void {
    this.tagsService.getTags().subscribe({
      next: (result) => this.availableTags.set(result.tags),
      error: (err) => console.error(err)
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

  setTab(tab: 'All Items' | 'Posts' | 'Snippets' | 'Issues' | 'Solutions'): void {
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
  }

  openItem(item: CollectionItem): void {
    // Navigate to the appropriate detail page based on type
    if (item.targetType === 'snippet' || item.targetType === 'private-snippet') {
      this.router.navigate(['/snippets', item.targetId]);
    } else if (item.targetType === 'post') {
      this.router.navigate(['/posts', item.targetId]);
    }
  }

  openTagModal(): void {
    this.showTagModal.set(true);
    this.tagModalStep.set('select');
    this.loadCollectionTags();
    this.loadAvailableTags();
  }

  closeTagModal(): void {
    this.showTagModal.set(false);
    this.tagModalStep.set('select');
    this.tagSearch.set('');
    this.newTagName.set('');
    this.newTagColor.set('#ffe500');
  }

  goToCreateTagPage(): void {
    this.tagModalStep.set('create');
    this.newTagName.set('');
    this.newTagColor.set('#ffe500');
  }

  goBackToSelectPage(): void {
    this.tagModalStep.set('select');
  }

  assignTag(tag: Tag): void {
    const id = this.collectionId();
    if (!id) return;

    this.collectionsService.assignTagToCollection(id, tag.id).subscribe({
      next: () => {
        this.collectionTags.set([...this.collectionTags(), tag]);
      },
      error: (err) => {
        this.error.set('Failed to add tag');
        console.error(err);
      }
    });
  }

  removeTag(event: Event, tag: Tag): void {
    event.stopPropagation();
    const id = this.collectionId();
    if (!id) return;

    this.collectionsService.removeTagFromCollection(id, tag.id).subscribe({
      next: () => {
        this.collectionTags.set(this.collectionTags().filter(t => t.id !== tag.id));
      },
      error: (err) => {
        this.error.set('Failed to remove tag');
        console.error(err);
      }
    });
  }

  createAndAssignTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;

    this.tagsService.createTag({ name, color: this.newTagColor() }).subscribe({
      next: (tag) => {
        this.availableTags.set([tag, ...this.availableTags()]);
        this.newTagName.set('');
        this.assignTag(tag);
      },
      error: (err) => {
        this.error.set('Failed to create tag');
        console.error(err);
      }
    });
  }

  shareCollection(): void {
    const coll = this.collection();
    if (!coll) return;

    // If collection is private, ask for confirmation
    if (!coll.isPublic) {
      this.showShareConfirmModal.set(true);
      return;
    }

    // If public, generate share link directly
    this.generateAndCopyShareLink();
  }

  closeShareConfirmModal(): void {
    this.showShareConfirmModal.set(false);
  }

  confirmAndMakePublic(): void {
    const id = this.collectionId();
    if (!id) return;

    this.isGeneratingShareLink.set(true);

    // First, make collection public
    this.collectionsService.updateCollection(id, { isPublic: true }).subscribe({
      next: () => {
        // Update local state
        const coll = this.collection();
        if (coll) {
          this.collection.set({ ...coll, isPublic: true });
        }
        // Then generate share link
        this.generateAndCopyShareLink();
        this.closeShareConfirmModal();
      },
      error: (err) => {
        this.error.set('Failed to update collection');
        this.isGeneratingShareLink.set(false);
        console.error(err);
      }
    });
  }

  generateAndCopyShareLink(): void {
    const id = this.collectionId();
    if (!id) return;

    this.collectionsService.generateShareLink(id, 'view', 30).subscribe({
      next: (response) => {
        navigator.clipboard.writeText(response.data.shareLink);
        alert('Share link copied to clipboard!');
        this.isGeneratingShareLink.set(false);
      },
      error: (err) => {
        this.error.set('Failed to generate share link');
        this.isGeneratingShareLink.set(false);
        console.error(err);
      }
    });
  }

  addNewItem(): void {
    // This would open a modal or navigate to create snippet/post
    alert('Add item functionality - to be implemented');
  }

  openEditModal(): void {
    const coll = this.collection();
    if (!coll) return;
    this.editCollectionName.set(coll.name);
    this.editCollectionPublic.set(coll.isPublic);
    this.editCollectionAllowEdit.set(coll.allowEdit);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  updateCollection(): void {
    const id = this.collectionId();
    if (!id || !this.editCollectionName().trim()) return;
    
    const dto = {
      name: this.editCollectionName(),
      isPublic: this.editCollectionPublic(),
      allowEdit: this.editCollectionAllowEdit()
    };
    
    this.collectionsService.updateCollection(id, dto).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadCollection();
      },
      error: (err) => {
        this.error.set('Failed to update collection');
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/collections']);
  }

  openMoveModal(event: Event, item: CollectionItem): void {
    event.stopPropagation();
    this.itemToMove.set(item);
    this.destinationCollectionId.set(null);
    this.showMoveModal.set(true);
    this.loadUserCollections();
  }

  closeMoveModal(): void {
    this.showMoveModal.set(false);
    this.itemToMove.set(null);
    this.destinationCollectionId.set(null);
  }

  loadUserCollections(): void {
    this.loadingCollections.set(true);
    this.collectionsService.getCollections({ size: 100 }).subscribe({
      next: (response) => {
        // Filter out the current collection
        const filtered = response.collections.filter(c => c.id !== this.collectionId());
        this.userCollections.set(filtered);
        this.loadingCollections.set(false);
      },
      error: (err) => {
        console.error('Failed to load collections', err);
        this.loadingCollections.set(false);
      }
    });
  }

  moveItemToCollection(): void {
    const sourceCollectionId = this.collectionId();
    const destCollectionId = this.destinationCollectionId();
    const item = this.itemToMove();

    if (!sourceCollectionId || !destCollectionId || !item) {
      return;
    }

    this.collectionsService.moveItem(
      sourceCollectionId,
      item.targetId,
      item.targetType,
      destCollectionId
    ).subscribe({
      next: () => {
        this.closeMoveModal();
        this.loadItems(); // Reload items to reflect the change
      },
      error: (err) => {
        this.error.set('Failed to move item');
        console.error(err);
      }
    });
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
}
