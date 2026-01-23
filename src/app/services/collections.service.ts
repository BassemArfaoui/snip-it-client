import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tag } from './tags.service';

export interface Collection {
  id: number;
  name: string;
  isPublic: boolean;
  allowEdit: boolean;
  itemCount?: number;
  tags?: Tag[];
  owner?: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: number;
  targetId: number;
  targetType: 'post' | 'snippet' | 'private-snippet' | 'issue' | 'solution';
  isPinned: boolean;
  isFavorite: boolean;
  addedAt: string;
  content?: any; // The actual post/snippet data
}

export interface CreateCollectionDto {
  name: string;
  isPublic?: boolean;
  allowEdit?: boolean;
}

export interface CollaboratorPermission {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  permission: 'view' | 'edit';
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private apiUrl = 'http://localhost:3000/collections';

  constructor(private http: HttpClient) {}

  // Get all user collections
  getCollections(params?: {
    page?: number;
    size?: number;
    q?: string;
    tags?: string[];
  }): Observable<{ collections: Collection[]; total: number; page: number; size: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.tags?.length) httpParams = httpParams.set('tags', params.tags.join(','));

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        collections: response.data?.items || [],
        total: response.data?.total || 0,
        page: response.data?.page || 1,
        size: response.data?.size || 12
      }))
    );
  }

  // Get single collection by ID
  getCollectionById(id: number): Observable<Collection> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  // Create new collection
  createCollection(dto: CreateCollectionDto): Observable<Collection> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => response.data || response)
    );
  }

  // Update collection
  updateCollection(id: number, dto: Partial<CreateCollectionDto>): Observable<Collection> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => response.data || response)
    );
  }

  // Delete collection
  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get collection items
  getCollectionItems(id: number, params?: {
    page?: number;
    size?: number;
    type?: string;
    language?: string;
    q?: string;
    sort?: string;
  }): Observable<{ items: CollectionItem[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.language) httpParams = httpParams.set('language', params.language);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<any>(`${this.apiUrl}/${id}/items`, { params: httpParams }).pipe(
      map(response => ({
        items: response.data?.items || [],
        total: response.data?.total || 0
      }))
    );
  }

  // Add item to collection
  addItem(collectionId: number, dto: {
    targetId: number;
    targetType: string;
    isPinned?: boolean;
    isFavorite?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${collectionId}/items`, dto);
  }

  // Remove item from collection
  removeItem(collectionId: number, targetId: number, targetType: string): Observable<void> {
    const params = new HttpParams()
      .set('targetId', targetId.toString())
      .set('targetType', targetType);
    return this.http.delete<void>(`${this.apiUrl}/${collectionId}/items`, { params });
  }

  // Toggle favorite
  toggleFavorite(collectionId: number, targetId: number, targetType: string, value: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/${collectionId}/items/favorite`, {
      targetId,
      targetType,
      value
    });
  }

  // Move item to another collection
  moveItem(collectionId: number, targetId: number, targetType: string, destinationCollectionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${collectionId}/items/move`, {
      targetId,
      targetType,
      destinationCollectionId
    });
  }

  // Get collaborators
  getCollaborators(collectionId: number): Observable<CollaboratorPermission[]> {
    return this.http.get<CollaboratorPermission[]>(`${this.apiUrl}/${collectionId}/collaborators`);
  }

  // Collection Tags
  getCollectionTags(collectionId: number): Observable<Tag[]> {
    return this.http.get<any>(`${this.apiUrl}/${collectionId}/tags`).pipe(
      map(response => response.data || response)
    );
  }

  assignTagToCollection(collectionId: number, tagId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${collectionId}/tags/${tagId}`, {});
  }

  removeTagFromCollection(collectionId: number, tagId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${collectionId}/tags/${tagId}`);
  }

  // Add collaborator
  addCollaborator(collectionId: number, userId: number, permission: 'view' | 'edit'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${collectionId}/collaborators`, { userId, permission });
  }

  // Remove collaborator
  removeCollaborator(collectionId: number, collaboratorId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${collectionId}/collaborators/${collaboratorId}`);
  }

  // Generate share link
  generateShareLink(collectionId: number, permission: 'view' | 'edit', expiresInDays?: number): Observable<{ token: string; url: string }> {
    return this.http.post<any>(`${this.apiUrl}/${collectionId}/share`, { permission, expiresInDays });
  }

  // Revoke share link
  revokeShareLink(collectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${collectionId}/share`);
  }
}
