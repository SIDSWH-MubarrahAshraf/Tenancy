import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {

  private readonly apiUrl = `${environment.apiUrl}/ty/service-types`;

  // Paste your JWT token here temporarily
  private readonly token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYWRtaW4iLCJleHAiOjE3ODI3MzQ2NTUsImlzcyI6IlNJRF9UWUVSUCIsImF1ZCI6IlNJRF9UWUVSUF9DTElFTlQifQ.iB-5nBGD2XE7p1pnhDY6eNYGI2lJIt4wEk2OMNZ7lIM';

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