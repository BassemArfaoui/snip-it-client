import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Tag {
  id: number;
  name: string;
  color?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagQuery {
  page?: number;
  size?: number;
  q?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private apiUrl = 'http://localhost:3000/tags';

  constructor(private http: HttpClient) {}

  getTags(params?: TagQuery): Observable<{ tags: Tag[]; total: number; page: number; size: number }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        tags: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
        page: response.data?.page || response.page || params?.page || 1,
        size: response.data?.size || response.size || params?.size || 20,
      }))
    );
  }

  createTag(dto: CreateTagDto): Observable<Tag> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => response.data || response)
    );
  }
}
