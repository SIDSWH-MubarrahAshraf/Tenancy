import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginRequest, LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth/login`;

  /**
   * Log in user using credentials and store JWT token on success
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (response && response.data) {
          if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
          }
          if (response.data.userName) {
            localStorage.setItem('username', response.data.userName);
          }
        } else if (response && (response as any).token) {
          localStorage.setItem('token', (response as any).token);
        }
      })
    );
  }

  /**
   * Log out user by deleting stored JWT token
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  /**
   * Fetch stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
