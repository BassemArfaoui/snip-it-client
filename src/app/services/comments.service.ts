import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CommentAuthor {
  id: number;
  username: string;
}

export interface Comment {
  id: number;
  user: CommentAuthor;
  targetId: number;
  targetType: 'POST' | 'ISSUE' | 'SOLUTION';
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface PaginatedComments {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommentResponse {
  data: Comment;
  message?: string;
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
export class CommentsService {
  private apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient) {}

  // Get comments for a post
  getPostComments(postId: number, page: number = 1, limit: number = 10): Observable<PaginatedComments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<ApiResponse<PaginatedResult<Comment>>>(`${this.apiUrl}/posts/${postId}`, { params })
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

  // Create a comment on a post
  createPostComment(postId: number, request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/posts/${postId}`, request).pipe(
      map(response => response.data)
    );
  }

  // Get comments for a solution
  getSolutionComments(solutionId: number, page: number = 1, limit: number = 10): Observable<PaginatedComments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<ApiResponse<PaginatedResult<Comment>>>(`${this.apiUrl}/solutions/${solutionId}`, { params })
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

  // Create a comment on a solution
  createSolutionComment(solutionId: number, request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/solutions/${solutionId}`, request).pipe(
      map(response => response.data)
    );
  }

  // Update a comment
  updateComment(commentId: number, request: UpdateCommentRequest): Observable<Comment> {
    return this.http.patch<CommentResponse>(`${this.apiUrl}/${commentId}`, request).pipe(
      map(response => response.data)
    );
  }

  // Delete a comment
  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }
}
