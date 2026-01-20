import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type VoteType = 'LIKE' | 'DISLIKE';
export type TargetType = 'ISSUE' | 'SOLUTION';

export interface VoteRequest {
  targetId: number;
  targetType: TargetType;
  voteType: VoteType;
}

export interface VoteResponse {
  data: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class VotesService {
  private apiUrl = 'http://localhost:3000/votes';

  constructor(private http: HttpClient) {}

  vote(request: VoteRequest): Observable<any> {
    return this.http.post<VoteResponse>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }
}
