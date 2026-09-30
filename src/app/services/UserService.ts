// File: src/app/services/UserService.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  /** GET /api/users/count → total rows in imp.Users */
  getUserCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/users/count`);
  }

  /** POST /api/users/existing-emails → the given emails (trimmed, lower-cased) already in imp.Users */
  getExistingEmails(emails: string[]): Observable<string[]> {
    return this.http.post<string[]>(`${environment.apiUrl}/users/existing-emails`, emails);
  }
}
