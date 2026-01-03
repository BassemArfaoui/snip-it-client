import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isEmailVerified: boolean;
  imageProfile?: string;
  contributorScore?: number;
  subscriberCount?: number;
  followingCount?: number;
  postsCount?: number;
  solutionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = 'http://localhost:3000/auth/admin';

  constructor(private http: HttpClient) {}

  listUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/users`);
  }

  promote(userId: number) {
    return this.http.post(`${this.base}/users/${userId}/promote`, {});
  }

  demote(userId: number) {
    return this.http.post(`${this.base}/users/${userId}/demote`, {});
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.base}/users/${userId}`);
  }

  banUser(userId: number) {
    return this.http.post(`${this.base}/users/${userId}/ban`, {});
  }

  unbanUser(userId: number) {
    return this.http.post(`${this.base}/users/${userId}/unban`, {});
  }

  // Post moderation
  deletePost(postId: number) { return this.http.post(`${this.base}/posts/${postId}/delete`, {}); }
  restorePost(postId: number) { return this.http.post(`${this.base}/posts/${postId}/restore`, {}); }

  // Comment moderation
  deleteComment(commentId: number) { return this.http.post(`${this.base}/comments/${commentId}/delete`, {}); }
  restoreComment(commentId: number) { return this.http.post(`${this.base}/comments/${commentId}/restore`, {}); }

  // Solution moderation
  deleteSolution(solutionId: number) { return this.http.post(`${this.base}/solutions/${solutionId}/delete`, {}); }

  // Issues
  deleteIssue(issueId: number) { return this.http.post(`${this.base}/issues/${issueId}/delete`, {}); }
  restoreIssue(issueId: number) { return this.http.post(`${this.base}/issues/${issueId}/restore`, {}); }
}
