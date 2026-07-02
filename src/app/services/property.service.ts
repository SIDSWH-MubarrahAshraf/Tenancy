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
    return this.http.post<any>(this.apiUrl, property);
  }

  /**
   * Save property (Alias to addProperty)
   */
  saveProperty(property: Property): Observable<any> {
    return this.addProperty(property);
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
