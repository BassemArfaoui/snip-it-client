import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SolutionContributor {
  id: number;
  username: string;
}

export interface SolutionSnippet {
  id?: number;
  title: string;
  content: string;
  language: string;
}

export interface Solution {
  id: number;
  issueId: number;
  contributor: SolutionContributor | null;
  textContent: string | null;
  snippet?: SolutionSnippet | null;
  externalLink: string | null;
  imageUrl: string | null;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSolutionRequest {
  textContent?: string;
  snippet?: SolutionSnippet;
  externalLink?: string;
  imageUrl?: string;
}

export interface UpdateSolutionRequest {
  textContent?: string;
  snippet?: SolutionSnippet;
  externalLink?: string;
  imageUrl?: string;
}

export interface SolutionListResponse {
  data: Solution[];
  message: string;
}

export interface SolutionResponse {
  data: Solution;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolutionsService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getSolutionsForIssue(issueId: number): Observable<Solution[]> {
    return this.http.get<SolutionListResponse>(`${this.apiUrl}/issues/${issueId}/solutions`).pipe(
      map(response => response.data)
    );
  }

  createSolution(issueId: number, solution: CreateSolutionRequest): Observable<Solution> {
    return this.http.post<SolutionResponse>(`${this.apiUrl}/issues/${issueId}/solutions`, solution).pipe(
      map(response => response.data)
    );
  }

  updateSolution(solutionId: number, solution: UpdateSolutionRequest): Observable<Solution> {
    return this.http.patch<SolutionResponse>(`${this.apiUrl}/solutions/${solutionId}`, solution).pipe(
      map(response => response.data)
    );
  }

  deleteSolution(solutionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/solutions/${solutionId}`);
  }

  acceptSolution(solutionId: number): Observable<Solution> {
    return this.http.patch<SolutionResponse>(`${this.apiUrl}/solutions/${solutionId}/accept`, {}).pipe(
      map(response => response.data)
    );
  }
}
