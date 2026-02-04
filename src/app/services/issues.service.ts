import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IssueAuthor {
  id: number;
  username: string;
}

export interface Issue {
  id: number;
  title: string;
  content: string;
  language: string;
  imageUrl?: string;
  solutions_count: number;
  is_resolved: boolean;
  likesCount: number;
  dislikesCount: number;
  created_at: string;
  author: IssueAuthor | null;

  // Moderation fields (soft-delete)
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface IssueDetails extends Issue {
  // Additional fields can be added if needed
}

export interface CreateIssueRequest {
  title: string;
  content: string;
  language: string;
  imageUrl?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  content?: string;
  language?: string;
  imageUrl?: string;
}

export interface IssueFilters {
  language?: string;
  is_resolved?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class IssuesService {
  private apiUrl = 'http://localhost:3000/issues';

  constructor(private http: HttpClient) {}

  getIssues(filters?: IssueFilters): Observable<Issue[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.language) {
        params = params.set('language', filters.language);
      }
      if (filters.is_resolved !== undefined) {
        params = params.set('is_resolved', filters.is_resolved.toString());
      }
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit !== undefined) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get<{data: Issue[]}>(this.apiUrl, { params }).pipe(
      map(response => response.data)
    );
  }

  getIssueById(id: number): Observable<IssueDetails> {
    return this.http.get<{data: IssueDetails}>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createIssue(issue: CreateIssueRequest): Observable<IssueDetails> {
    return this.http.post<{data: IssueDetails}>(this.apiUrl, issue).pipe(
      map(response => response.data)
    );
  }

  updateIssue(id: number, issue: UpdateIssueRequest): Observable<IssueDetails> {
    return this.http.patch<{data: IssueDetails}>(`${this.apiUrl}/${id}`, issue).pipe(
      map(response => response.data)
    );
  }

  deleteIssue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
