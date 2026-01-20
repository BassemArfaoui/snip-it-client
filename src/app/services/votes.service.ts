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

// Backend DTO format
interface CreateVoteDto {
  targetId: number;
  targetType: TargetType;
  isDislike: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VotesService {
  private apiUrl = 'http://localhost:3000/votes';

  constructor(private http: HttpClient) {}

  vote(request: VoteRequest): Observable<any> {
    // Convert frontend format to backend format
    const dto: CreateVoteDto = {
      targetId: request.targetId,
      targetType: request.targetType,
      isDislike: request.voteType === 'DISLIKE'
    };

    return this.http.post<VoteResponse>(this.apiUrl, dto).pipe(
      map(response => response.data)
    );
  }
}
