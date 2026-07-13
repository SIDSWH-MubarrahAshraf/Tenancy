import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocumentNumber, ApiResponse } from '../models/document-number.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentNumberService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ty/document-numbers`;

  getAll(): Observable<ApiResponse<DocumentNumber[]>> {
    return this.http.get<ApiResponse<DocumentNumber[]>>(this.baseUrl);
  }

  create(payload: DocumentNumber): Observable<ApiResponse<DocumentNumber>> {
    return this.http.post<ApiResponse<DocumentNumber>>(this.baseUrl, payload);
  }

  update(id: number, payload: DocumentNumber): Observable<ApiResponse<DocumentNumber>> {
    return this.http.put<ApiResponse<DocumentNumber>>(`${this.baseUrl}/${id}`, payload);
  }

  getNextNumber(documentType: string): Observable<ApiResponse<{ documentType: string; number: string }>> {
    return this.http.get<ApiResponse<{ documentType: string; number: string }>>(`${this.baseUrl}/next/${documentType}`);
  }

  getNext(documentType: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/next/${documentType}`);
  }
}
