import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss']
})
export class AnnouncementComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Base API URL
  private readonly baseUrl = environment.apiUrl.replace(/\/api$/, '');

  // Form Fields
  selectedPropIds = '';
  subject = '';
  body = '';
  selectedFile: File | null = null;
  isViewMode = false;
  attachmentUrl = '';
  recipients: any[] = [];

  // Modals & States
  showPropertyMasterModal = false;
  showHistoryModal = false;
  isLoadingProperties = false;
  isLoadingHistory = false;
  isSending = false;

  // Data Collections
  properties: any[] = [];
  historyAnnouncements: any[] = [];

  // Search Filters
  searchPropertyQuery = '';
  searchHistoryQuery = '';
  filteredProperties: any[] = [];
  filteredHistory: any[] = [];

  ngOnInit(): void {
    this.loadSweetAlert();
  }

  // Runtime SweetAlert injection to avoid npm dependencies
  private loadSweetAlert(): Promise<any> {
    if ((window as any).Swal) {
      return Promise.resolve((window as any).Swal);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      script.onload = () => resolve((window as any).Swal);
      document.body.appendChild(script);
    });
  }

  // File Upload Handler
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Modal Open: Property Master lookup
  openPropertyMaster(): void {
    this.showPropertyMasterModal = true;
    this.isLoadingProperties = true;
    this.properties = [];
    this.filteredProperties = [];

    const url = `${this.baseUrl}/PropertyManagement/GetPropertyMasters`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.properties = data || [];
        this.filterProperties();
        this.isLoadingProperties = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load property masters', err);
        this.isLoadingProperties = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter properties client-side
  filterProperties(): void {
    const q = (this.searchPropertyQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredProperties = [...this.properties];
    } else {
      this.filteredProperties = this.properties.filter(p =>
        String(p.propid || '').toLowerCase().includes(q) ||
        String(p.buildname || '').toLowerCase().includes(q) ||
        String(p.landname || '').toLowerCase().includes(q)
      );
    }
  }

  // Select Property ID from modal list (append comma separated)
  selectProperty(propid: string): void {
    const current = (this.selectedPropIds || '').trim();
    if (current) {
      // Split and check for duplicates
      const ids = current.split(',').map(x => x.trim()).filter(Boolean);
      if (!ids.includes(propid)) {
        ids.push(propid);
      }
      this.selectedPropIds = ids.join(', ');
    } else {
      this.selectedPropIds = propid;
    }
    this.showPropertyMasterModal = false;
  }

  // Modal Open: Announcement History lookup
  openHistory(): void {
    this.showHistoryModal = true;
    this.isLoadingHistory = true;
    this.historyAnnouncements = [];
    this.filteredHistory = [];

    const url = `${this.baseUrl}/Reminders/GetBuildingAnnoucment`;
    this.http.post<any[]>(url, { COPERATION: 1 }).subscribe({
      next: (data) => {
        this.historyAnnouncements = data || [];
        this.filterHistory();
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load announcements history', err);
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter history client-side
  filterHistory(): void {
    const q = (this.searchHistoryQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredHistory = [...this.historyAnnouncements];
    } else {
      this.filteredHistory = this.historyAnnouncements.filter(h =>
        String(h.pid || '').toLowerCase().includes(q) ||
        String(h.subject || '').toLowerCase().includes(q)
      );
    }
  }

  // Select Announcement from history (read-only view mode)
  selectHistory(item: any): void {
    this.selectedPropIds = item.pid || '';
    this.subject = item.subject || '';
    this.body = item.message || '';
    this.isViewMode = true;
    
    // Resolve attachment download url
    const fileName = item.attach || '';
    if (fileName.trim() !== '') {
      // Normalize url paths
      this.attachmentUrl = `${this.baseUrl}/${fileName.replace(/^\/+/, '')}`;
    } else {
      this.attachmentUrl = '';
    }

    this.showHistoryModal = false;
  }

  // Form Reset / Clear View Mode
  resetForm(): void {
    this.selectedPropIds = '';
    this.subject = '';
    this.body = '';
    this.selectedFile = null;
    this.isViewMode = false;
    this.attachmentUrl = '';
    this.recipients = [];
    
    // Clear file input element
    const fileInput = document.getElementById('excelFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Send Announcement Form Submission
  submitAnnouncement(): void {
    if (!this.selectedPropIds || !this.subject || !this.body || !this.selectedFile) {
      this.loadSweetAlert().then(Swal => {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please fill all required fields and upload an attachment'
        });
      });
      return;
    }

    const formData = new FormData();
    formData.append("PID", this.selectedPropIds);
    formData.append("SUBJECT", this.subject);
    formData.append("MESSAGE", this.body);
    formData.append("Attachment", this.selectedFile);

    this.isSending = true;
    
    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        title: 'Sending Emails...',
        html: 'Please wait while emails are being sent to property tenants.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    });

    const url = `${this.baseUrl}/Reminders/PostBuildingAnnoucment`;
    this.http.post<any>(url, formData).subscribe({
      next: (res) => {
        this.isSending = false;
        this.loadSweetAlert().then(Swal => {
          Swal.close();
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Sent Successfully',
              text: res.message || 'Announcements sent successfully.'
            });
            this.recipients = res.recipients || [];
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Send',
              text: res.message || 'Something went wrong.'
            });
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.isSending = false;
        console.error('Failed to post announcement', err);
        this.loadSweetAlert().then(Swal => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Something went wrong while sending announcements. Please try again later.'
          });
        });
        this.cdr.detectChanges();
      }
    });
  }
}
