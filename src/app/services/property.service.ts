import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  // Base API URL
  private apiUrl = `${environment.apiUrl}/ty/properties`;

  constructor(private http: HttpClient) { }
private headers = new HttpHeaders({
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImFkbWluIiwiZXhwIjoxNzgyOTMyMDQ3LCJpc3MiOiJTSURfVFlFUlAiLCJhdWQiOiJTSURfVFlFUlBfQ0xJRU5UIn0.tqwNj-gOtAOcAj63SzTuXed4u5-EYNjyc5g2W4Kf4jI'
});
  /**
   * Get all properties
   */
  getProperties(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * Get property by Id
   */
  getProperty(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Add new property
   */
  addProperty(property: Property): Observable<any> {
    return this.http.post<any>(this.apiUrl, property,
    {
      headers: this.headers
    });
  }

  /**
   * Update property
   */
  updateProperty(id: number, property: Property): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, property);
  }

  /**
   * Delete property
   */
  deleteProperty(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Upload Property Attachment
   */
  uploadAttachment(
    propertyId: number,
    file: File,
    remarks: string = ''
  ): Observable<any> {

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.apiUrl}/${propertyId}/attachments?remarks=${encodeURIComponent(remarks)}`,
      formData
    );
  }

}