import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EmailAttachment {
  filename: string;
  fileSize: string;
  fileType: string;
}

interface EmailLog {
  id: string;
  sender: string;
  recipient: string;
  recipientName: string;
  custId?: string;
  unitId?: string;
  subject: string;
  body: string;
  sentDate: string;
  status: 'Sent' | 'Failed';
  type: 'Renewal' | 'Move-Out' | 'Announcement';
  attachments: EmailAttachment[];
}

@Component({
  selector: 'app-log-emails',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './log-emails.component.html',
  styleUrls: ['./log-emails.component.scss']
})
export class LogEmailsComponent implements OnInit {
  activeTab: 'logs' | 'attachments' = 'logs';
  emailLogs: EmailLog[] = [];
  filteredLogs: EmailLog[] = [];
  
  // Search and Filter fields
  searchText: string = '';
  selectedType: string = 'ALL';
  selectedStatus: string = 'ALL';

  // Custom Dropdowns state
  showTypeDropdown: boolean = false;
  showStatusDropdown: boolean = false;
  typeDropdownStyle: any = {};
  statusDropdownStyle: any = {};

  // Details Modal state
  selectedLog: EmailLog | null = null;
  showDetailsModal: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    const raw = localStorage.getItem('email_logs');
    if (raw && JSON.parse(raw).length > 0) {
      this.emailLogs = JSON.parse(raw);
    } else {
      // Prepopulate with mock data
      const mockLogs: EmailLog[] = [
        {
          id: 'MSG-001',
          sender: 'noreply@alzebaq.com',
          recipient: 'johndoe@gmail.com',
          recipientName: 'John Doe',
          custId: 'CUST-104',
          unitId: '104',
          subject: 'URGENT: Lease Expiry & Renewal Proposal - Unit 104',
          body: `Dear John Doe,\n\nThis is an automated reminder that your lease agreement for Unit 104 is set to expire on 2026-10-15.\n\nWe have prepared a renewal proposal with a Proposed Annual Rent of AED 78,000. Please log in to your tenant portal or reply to this email to confirm your interest.\n\nBest regards,\nAl-Zebaq Property Management`,
          sentDate: '2026-07-09T10:15:30Z',
          status: 'Sent',
          type: 'Renewal',
          attachments: []
        },
        {
          id: 'MSG-002',
          sender: 'admin@alzebaq.com',
          recipient: 'sarah.smith@yahoo.com',
          recipientName: 'Sarah Smith',
          custId: 'CUST-205',
          unitId: '205',
          subject: 'Move-Out Clearance & Security Deposit Return Guidelines',
          body: `Dear Sarah Smith,\n\nWe acknowledge that you have selected 'Not Interested' for renewing your lease for Unit 205. Your move-out date is scheduled for 2026-09-30.\n\nPlease refer to the attached checklist guidelines regarding clean-up and key handover protocols required for security deposit processing.\n\nBest regards,\nAl-Zebaq Admin`,
          sentDate: '2026-07-09T09:44:12Z',
          status: 'Sent',
          type: 'Move-Out',
          attachments: [
            { filename: 'MoveOut_Checklist.pdf', fileSize: '245 KB', fileType: 'PDF' }
          ]
        },
        {
          id: 'MSG-003',
          sender: 'info@alzebaq.com',
          recipient: 'all-tenants@alzebaq-properties.com',
          recipientName: 'All Tenants - Al-Zebaq Building A',
          custId: 'ALL-TENANTS',
          unitId: 'BLDG-A',
          subject: 'ANNOUNCEMENT: Preventive Fire Alarm Maintenance Schedule',
          body: `Dear Valued Residents,\n\nPlease be informed that the annual preventive fire alarm maintenance test is scheduled for Al-Zebaq Building A on Saturday, July 12th, between 9:00 AM and 1:00 PM.\n\nIntermittent alarms will ring during testing. We apologize for any inconvenience caused.\n\nBest regards,\nProperty Operations Group`,
          sentDate: '2026-07-08T14:00:00Z',
          status: 'Sent',
          type: 'Announcement',
          attachments: [
            { filename: 'FireAlarm_Notice.pdf', fileSize: '1.2 MB', fileType: 'PDF' },
            { filename: 'BuildingRules_2026.pdf', fileSize: '3.4 MB', fileType: 'PDF' }
          ]
        },
        {
          id: 'MSG-004',
          sender: 'noreply@alzebaq.com',
          recipient: 'robert.jones@gmail.com',
          recipientName: 'Robert Jones',
          custId: 'CUST-312',
          unitId: '312',
          subject: 'Lease Renewal Proposal Reminder - Unit 312',
          body: `Dear Robert Jones,\n\nThis is a follow-up reminder that your lease agreement for Unit 312 expires on 2026-10-01.\n\nProposed annual rent: AED 92,000. Please respond as soon as possible to secure your unit.\n\nSincerely,\nAl-Zebaq Property Management`,
          sentDate: '2026-07-07T11:20:00Z',
          status: 'Failed',
          type: 'Renewal',
          attachments: []
        }
      ];
      this.emailLogs = mockLogs;
      localStorage.setItem('email_logs', JSON.stringify(mockLogs));
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.emailLogs];

    // Text search
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      list = list.filter(item => 
        item.subject.toLowerCase().includes(q) ||
        item.recipient.toLowerCase().includes(q) ||
        item.recipientName.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (this.selectedType !== 'ALL') {
      list = list.filter(item => item.type === this.selectedType);
    }

    // Status filter
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(item => item.status === this.selectedStatus);
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());

    this.filteredLogs = list;
    this.cdr.detectChanges();
  }

  get allAttachments(): any[] {
    const list: any[] = [];
    this.emailLogs.forEach(log => {
      log.attachments.forEach(att => {
        list.push({
          ...att,
          emailId: log.id,
          emailSubject: log.subject,
          recipient: log.recipient,
          sentDate: log.sentDate
        });
      });
    });
    // Sort descending by date
    list.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
    return list;
  }

  openLogDetails(log: EmailLog): void {
    this.selectedLog = log;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }

  closeDetailsModal(): void {
    this.selectedLog = null;
    this.showDetailsModal = false;
    this.cdr.detectChanges();
  }

  deleteLog(logId: string, event: MouseEvent): void {
    event.stopPropagation();
    (window as any).Swal.fire({
      title: 'Delete Log Entry',
      text: `Are you sure you want to delete log entry ${logId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C62828',
      cancelButtonColor: '#30277C',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.emailLogs = this.emailLogs.filter(item => item.id !== logId);
        localStorage.setItem('email_logs', JSON.stringify(this.emailLogs));
        this.applyFilters();
        (window as any).Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'The log entry has been removed.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  clearAllLogs(): void {
    (window as any).Swal.fire({
      title: 'Clear All Logs',
      text: 'Are you sure you want to permanently clear all email logs and attachments?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C62828',
      cancelButtonColor: '#30277C',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.emailLogs = [];
        localStorage.setItem('email_logs', JSON.stringify([]));
        this.applyFilters();
        (window as any).Swal.fire({
          icon: 'success',
          title: 'Cleared',
          text: 'All logs have been cleared.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  downloadMockAttachment(att: any): void {
    (window as any).Swal.fire({
      icon: 'info',
      title: 'Downloading Attachment',
      text: `Mock downloading file "${att.filename}" (${att.fileSize})`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}`;
  }

  getTypeLabel(): string {
    switch (this.selectedType) {
      case 'Renewal': return 'Lease Renewal';
      case 'Move-Out': return 'Tenant Move-Out';
      case 'Announcement': return 'Announcements';
      default: return 'All Types';
    }
  }

  getStatusLabel(): string {
    switch (this.selectedStatus) {
      case 'Sent': return 'Sent Successfully';
      case 'Failed': return 'Failed';
      default: return 'All Statuses';
    }
  }

  toggleTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showStatusDropdown = false;
    this.showTypeDropdown = !this.showTypeDropdown;
    if (this.showTypeDropdown) {
      const trigger = event.currentTarget as HTMLElement;
      const rect = trigger.getBoundingClientRect();
      this.typeDropdownStyle = {
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: '9999'
      };
      this.cdr.detectChanges();
    }
  }

  selectType(type: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedType = type;
    this.showTypeDropdown = false;
    this.applyFilters();
  }

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showTypeDropdown = false;
    this.showStatusDropdown = !this.showStatusDropdown;
    if (this.showStatusDropdown) {
      const trigger = event.currentTarget as HTMLElement;
      const rect = trigger.getBoundingClientRect();
      this.statusDropdownStyle = {
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: '9999'
      };
      this.cdr.detectChanges();
    }
  }

  selectStatus(status: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.applyFilters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.showTypeDropdown = false;
      this.showStatusDropdown = false;
    }
  }
}
