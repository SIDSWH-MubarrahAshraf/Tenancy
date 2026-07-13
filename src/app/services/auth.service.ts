import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LoginRequest, LoginResponse } from '../models/login.model';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  /**
   * Log in user using credentials and store JWT token on success
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.data) {
          if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.refreshToken);
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
   * Refresh JWT token using the refresh token API
   */
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<any>(`${this.authUrl}/refresh-token`, { refreshToken }).pipe(
      tap((response) => {
        if (response && response.data) {
          if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.refreshToken);
          }
        }
      })
    );
  }

  /**
   * Log out user by deleting stored JWT token and resetting theme
   */
  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      this.http.post(`${this.authUrl}/logout`, { refreshToken }).subscribe({
        next: () => console.log('Backend logout success'),
        error: (err) => console.error('Backend logout error', err)
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
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

  /**
   * Helper to return standard authorization headers
   */
  authHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  }
}
