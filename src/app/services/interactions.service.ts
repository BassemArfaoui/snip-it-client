import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InteractionTargetType = 'POST' | 'ISSUE' | 'SOLUTION' | 'COMMENT';
export type ReactionType = 'HEART' | 'HELPFUL' | 'FIRE' | 'FUNNY' | 'INCORRECT';

export interface CreateInteractionRequest {
  targetType: InteractionTargetType;
  targetId: number;
  type: ReactionType;
}

@Injectable({
  providedIn: 'root'
})
export class InteractionsService {
  private apiUrl = 'http://localhost:3000/interactions';

  constructor(private http: HttpClient) {}

  react(request: CreateInteractionRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  unreact(targetType: InteractionTargetType, targetId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/target/${targetType}/${targetId}`);
  }
}
