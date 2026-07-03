import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ServiceType } from '../models/service-type.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  // Base API URL
  private readonly apiUrl = `${environment.apiUrl}/ty/service-types`;

  constructor(private http: HttpClient) {}

  /**
   * Get all service types
   */
  getAll(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * Get a single service type by ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new service type
   */
  create(model: ServiceType): Observable<any> {
    return this.http.post<any>(this.apiUrl, model);
  }

  /**
   * Update an existing service type by ID
   */
  update(id: number, model: ServiceType): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, model);
  }

  /**
   * Delete a service type by ID
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}