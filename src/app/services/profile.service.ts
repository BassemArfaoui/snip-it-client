import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ProfileSummary {
  name: string;
  username: string;
  followers: number;
  followedBy: number;
  posts: number;
  issues: number;
  score: number;
  email?: string;
  imageProfile?: string | null;
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
  rank?: number;
  postsCount?: number;
  issuesCount?: number;
  followers?: number;
  imageProfile?: string | null;
}

export interface ContributionDay {
  date: string;
  count: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastContributionDate: string | null;
  totalContributions: number;
}

export interface UpdateProfilePayload {
  imageProfile?: string;
  username?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/profile';

  constructor(private http: HttpClient) {}

  getProfile(userId: number): Observable<ProfileSummary> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getSavedPosts(userId: number): Observable<Post[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/saved_posts`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getBadges(userId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/bagdes`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getUserPosts(userId: number): Observable<Post[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/posts`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getUserIssues(userId: number): Observable<Issue[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/issues`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getContributionGraph(userId: number): Observable<ContributionDay[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/contrubution_graph`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getStreak(userId: number): Observable<StreakStats> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/streak`).pipe(
      map((response: any) => response.data || response)
    );
  }

  getLeaderBoard(userId: number): Observable<LeaderBoardUser[]> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/leader_board`).pipe(
      map((response: any) => response.data || response)
    );
  }

  updateProfile(payload: UpdateProfilePayload): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}`, payload).pipe(
      map((response: any) => response.data || response)
    );
  }
}
