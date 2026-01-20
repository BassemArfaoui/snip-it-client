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

export interface CommentsListResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

    return this.http.get<CommentsListResponse>(`${this.apiUrl}/posts/${postId}`, { params });
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

    return this.http.get<CommentsListResponse>(`${this.apiUrl}/solutions/${solutionId}`, { params });
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
