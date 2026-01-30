import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type ReactionType = 'HEART' | 'HELPFUL' | 'FIRE' | 'FUNNY' | 'INCORRECT';

export interface PostAuthor {
  id: number;
  username: string;
  fullName?: string;
}

export interface Snippet {
  id: number;
  title: string | null;
  content: string;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostInteractionsSummary {
  total: number;
  HEART: number;
  HELPFUL: number;
  FIRE: number;
  FUNNY: number;
  INCORRECT: number;
  didInteract: boolean;
  myType: ReactionType | null;
}

export interface Post {
  id: number;
  title: string;
  description: string;
  githubLink: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  author: PostAuthor;
  snippet: Snippet;
  interactions?: PostInteractionsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePostRequest {
  title: string;
  description: string;
  snippetContent: string;
  snippetLanguage: string;
  snippetTitle?: string;
  githubLink?: string;
}

export interface UpdatePostRequest {
  title?: string;
  description?: string;
  snippetContent?: string;
  snippetLanguage?: string;
  snippetTitle?: string;
  githubLink?: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getPosts(page: number = 1, limit: number = 10): Observable<PaginatedPosts> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http
      .get<ApiResponse<PaginatedResult<Post>>>(this.apiUrl, { params })
      .pipe(
        map((res) => ({
          data: res.data.data,
          page: res.data.meta.page,
          limit: res.data.meta.limit,
          total: res.data.meta.total,
          totalPages: res.data.meta.totalPages,
        })),
      );
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<ApiResponse<Post>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  createPost(post: CreatePostRequest): Observable<Post> {
    return this.http.post<ApiResponse<Post>>(this.apiUrl, post).pipe(map((res) => res.data));
  }

  updatePost(id: number, patch: UpdatePostRequest): Observable<Post> {
    return this.http.patch<ApiResponse<Post>>(`${this.apiUrl}/${id}`, patch).pipe(map((res) => res.data));
  }

  deletePost(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
