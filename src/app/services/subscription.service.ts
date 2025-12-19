import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FollowResponse {
  status: 'followed' | 'unfollowed';
  followers: number;
  following: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = 'http://localhost:3000/subscriptions';

  constructor(private http: HttpClient) {}

  follow(targetUserId: number): Observable<FollowResponse> {
    return this.http.post<any>(`${this.apiUrl}/${targetUserId}`, {}).pipe(
      map((response: any) => response.data || response)
    );
  }

  unfollow(targetUserId: number): Observable<FollowResponse> {
    return this.http.delete<any>(`${this.apiUrl}/${targetUserId}`).pipe(
      map((response: any) => response.data || response)
    );
  }
}
