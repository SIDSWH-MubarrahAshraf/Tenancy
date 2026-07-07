import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private http = inject(HttpClient);
  // Modify base URL path to match your API structure
  private readonly baseUrl = `${environment.apiUrl}/ty/units`; 

  getByPropertyId(propertyId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?propertyId=${propertyId}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }
}