import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ty/dashboard`;

  /**
   * Get dynamic tenancy summary data
   */
  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

  /**
   * Get dynamic alerts data (e.g. expiring contracts, cheques due, bounced cheques)
   */
  getAlerts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alerts`);
  }
}
