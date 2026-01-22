import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PrivateSnippet {
  id: number;
  title: string;
  content: string;
  language: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: number; name: string }>;
}

export interface SnippetVersion {
  id: number;
  content: string;
  createdAt: string;
  note?: string;
}

export interface CreateSnippetDto {
  title: string;
  content: string;
  language: string;
}

export interface UpdateSnippetDto {
  title?: string;
  content?: string;
  language?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivateSnippetsService {
  private apiUrl = 'http://localhost:3000/private-snippets';

  constructor(private http: HttpClient) {}

  // Get all user's private snippets
  getSnippets(params?: {
    page?: number;
    size?: number;
    q?: string;
    language?: string;
    tags?: string[];
  }): Observable<{ snippets: PrivateSnippet[]; total: number; page: number; size: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.language) httpParams = httpParams.set('language', params.language);
    if (params?.tags?.length) httpParams = httpParams.set('tags', params.tags.join(','));

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        snippets: response.data?.items || [],
        total: response.data?.total || 0,
        page: response.data?.page || 1,
        size: response.data?.size || 20
      }))
    );
  }

  // Get single snippet by ID
  getSnippetById(id: number): Observable<PrivateSnippet> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  // Create new snippet
  createSnippet(dto: CreateSnippetDto): Observable<PrivateSnippet> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => response.data || response)
    );
  }

  // Update snippet
  updateSnippet(id: number, dto: UpdateSnippetDto): Observable<PrivateSnippet> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => response.data || response)
    );
  }

  // Delete snippet
  deleteSnippet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Transform to public post
  transformToPost(id: number, data: {
    title: string;
    description: string;
    publish?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/transform`, data);
  }

  // Get snippet versions
  getVersions(id: number, params?: {
    page?: number;
    size?: number;
  }): Observable<{ versions: SnippetVersion[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<any>(`${this.apiUrl}/${id}/versions`, { params: httpParams }).pipe(
      map(response => ({
        versions: response.data?.versions || [],
        total: response.data?.total || 0
      }))
    );
  }

  // Delete version
  deleteVersion(snippetId: number, versionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${snippetId}/versions/${versionId}`);
  }

  // Assign tag
  assignTag(snippetId: number, tagId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${snippetId}/tags/${tagId}`, {});
  }

  // Remove tag
  removeTag(snippetId: number, tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${snippetId}/tags/${tagId}`);
  }

  // Get snippet tags
  getTags(snippetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${snippetId}/tags`);
  }
}
