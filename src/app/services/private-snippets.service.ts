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
      map(response => {
        const items = response.data?.items || response.items || [];
        return {
          snippets: items.map((item: any) => ({
            id: item.id,
            title: item.snippet?.title || item.title,
            content: item.snippet?.content || item.content,
            language: item.snippet?.language || item.language,
            userId: item.userId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            tags: item.tags || []
          })),
          total: response.data?.total || response.total || 0,
          page: response.data?.page || response.page || 1,
          size: response.data?.size || response.size || 20
        };
      })
    );
  }

  // Get single snippet by ID
  getSnippetById(id: number): Observable<PrivateSnippet> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return {
          id: data.id,
          title: data.snippet?.title || data.title,
          content: data.snippet?.content || data.content,
          language: data.snippet?.language || data.language,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || []
        };
      })
    );
  }

  // Create new snippet
  createSnippet(dto: CreateSnippetDto): Observable<PrivateSnippet> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => {
        const data = response.data || response;
        // Return the snippet ID from the private snippet
        return {
          id: data.id,
          title: data.snippet?.title || data.title,
          content: data.snippet?.content || data.content,
          language: data.snippet?.language || data.language,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || []
        };
      })
    );
  }

  // Update snippet
  updateSnippet(id: number, dto: UpdateSnippetDto): Observable<PrivateSnippet> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => {
        const data = response.data || response;
        return {
          id: data.id,
          title: data.snippet?.title || data.title,
          content: data.snippet?.content || data.content,
          language: data.snippet?.language || data.language,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          tags: data.tags || []
        };
      })
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
