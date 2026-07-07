import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmailSettings, EmailTestRequest } from '../models/email-settings.model';

@Injectable({
  providedIn: 'root'
})
export class EmailSettingsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ty/email-settings`;

  getAll(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  create(payload: EmailSettings): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  update(id: number, payload: EmailSettings): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  test(payload: EmailTestRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/test`, payload);
  }
}
