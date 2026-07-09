import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '../models/user.model';
import { SecurityGroup, Permission } from '../models/security-group.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityGroupService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ty/security-groups`;

  getAll(): Observable<ApiResponse<SecurityGroup[]>> {
    return this.http.get<ApiResponse<SecurityGroup[]>>(this.baseUrl);
  }

  create(group: { groupCode: string; groupName: string; isActive: boolean }): Observable<ApiResponse<SecurityGroup>> {
    return this.http.post<ApiResponse<SecurityGroup>>(this.baseUrl, group);
  }

  update(id: number, group: { groupCode: string; groupName: string; isActive: boolean }): Observable<ApiResponse<SecurityGroup>> {
    return this.http.put<ApiResponse<SecurityGroup>>(`${this.baseUrl}/${id}`, group);
  }

  savePermissions(id: number, permissions: Permission[]): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/${id}/permissions`, { permissions });
  }
}
