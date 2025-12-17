import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfileSummary {
  name: string;
  username: string;
  followers: number;
  followedBy: number;
  posts: number;
  issues: number;
  score: number;
}

export interface Post {
  id: number;
  title: string;
  description: string;
  snippet?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
}

export interface Issue {
  id: number;
  content: string;
  language: string;
  solutionsCount: number;
  isResolved: boolean;
  createdAt?: string;
}

export interface LeaderBoardUser {
  id: number;
  name: string;
  username: string;
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/profile';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(userId: number): Observable<ProfileSummary> {
    return this.http.get<ProfileSummary>(`${this.apiUrl}/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getSavedPosts(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/${userId}/saved_posts`, {
      headers: this.getAuthHeaders()
    });
  }

  getBadges(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}/bagdes`, {
      headers: this.getAuthHeaders()
    });
  }

  getUserPosts(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/${userId}/posts`, {
      headers: this.getAuthHeaders()
    });
  }

  getUserIssues(userId: number): Observable<Issue[]> {
    return this.http.get<Issue[]>(`${this.apiUrl}/${userId}/issues`, {
      headers: this.getAuthHeaders()
    });
  }

  getContributionGraph(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/contrubution_graph`, {
      headers: this.getAuthHeaders()
    });
  }

  getStreak(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/streak`, {
      headers: this.getAuthHeaders()
    });
  }

  getLeaderBoard(userId: number): Observable<LeaderBoardUser[]> {
    return this.http.get<LeaderBoardUser[]>(`${this.apiUrl}/${userId}/leader_board`, {
      headers: this.getAuthHeaders()
    });
  }
}
