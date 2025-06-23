import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LoginResponse { token: string; expiration: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'jwt_token';
  constructor(private http: HttpClient) {}
  login(name: string, password: string) {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`,
      { name, password }
    ).pipe(
      tap(resp => localStorage.setItem(this.tokenKey, resp.token))
    );
  }
  getToken() { return localStorage.getItem(this.tokenKey); }
}
