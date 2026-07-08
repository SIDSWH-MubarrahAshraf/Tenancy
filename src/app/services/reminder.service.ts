import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmailTemplate, ReminderSetting } from '../models/reminder.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private http = inject(HttpClient);
  private readonly emailTemplatesUrl = `${environment.apiUrl}/ty/email-templates`;
  private readonly reminderSettingsUrl = `${environment.apiUrl}/ty/reminder-settings`;
  private readonly runReminderUrl = `${environment.apiUrl}/ty/reminders/run-now`;

  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================
  getEmailTemplates(): Observable<ApiResponse<EmailTemplate[]>> {
    return this.http.get<ApiResponse<EmailTemplate[]>>(this.emailTemplatesUrl);
  }

  createEmailTemplate(payload: EmailTemplate): Observable<ApiResponse<EmailTemplate>> {
    return this.http.post<ApiResponse<EmailTemplate>>(this.emailTemplatesUrl, payload);
  }

  updateEmailTemplate(id: number, payload: EmailTemplate): Observable<ApiResponse<EmailTemplate>> {
    return this.http.put<ApiResponse<EmailTemplate>>(`${this.emailTemplatesUrl}/${id}`, payload);
  }

  // ==========================================
  // REMINDER SETTINGS
  // ==========================================
  getReminderSettings(): Observable<ApiResponse<ReminderSetting[]>> {
    return this.http.get<ApiResponse<ReminderSetting[]>>(this.reminderSettingsUrl);
  }

  createReminderSetting(payload: ReminderSetting): Observable<ApiResponse<ReminderSetting>> {
    return this.http.post<ApiResponse<ReminderSetting>>(this.reminderSettingsUrl, payload);
  }

  updateReminderSetting(id: number, payload: ReminderSetting): Observable<ApiResponse<ReminderSetting>> {
    return this.http.put<ApiResponse<ReminderSetting>>(`${this.reminderSettingsUrl}/${id}`, payload);
  }

  // ==========================================
  // RUN REMINDER JOB
  // ==========================================
  runReminderNow(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.runReminderUrl, {});
  }
}
