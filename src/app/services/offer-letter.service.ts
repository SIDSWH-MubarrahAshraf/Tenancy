import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OfferLetterService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Contract`;

  getDocNumList(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/GetDocNumList`, payload);
  }

  postDocNumList(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PostDocNumList`, payload);
  }

  generateContractDetails(payload: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/ContractDetails`, payload, {
      responseType: 'blob'
    });
  }
}
