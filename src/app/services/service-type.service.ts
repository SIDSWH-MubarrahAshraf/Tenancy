import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {

  private readonly apiUrl = `${environment.apiUrl}/ty/service-types`;

  // Paste your JWT token here temporarily
  private readonly token = '';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
  }

  getAll() {
    return this.http.get(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getById(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  create(model: any) {
    return this.http.post(this.apiUrl, model, {
      headers: this.getHeaders()
    });
  }

  update(id: number, model: any) {
    return this.http.put(`${this.apiUrl}/${id}`, model, {
      headers: this.getHeaders()
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}