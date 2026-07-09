import { Component, OnInit, ChangeDetectorRef, NgZone, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from 'src/app/services/reminder.service';
import { ReminderSetting, EmailTemplate } from 'src/app/models/reminder.model';

@Component({
  selector: 'app-reminder-setting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminder-setting.component.html',
  styleUrls: ['./reminder-setting.component.scss']
})
export class ReminderSettingComponent implements OnInit {

  // Search filter
  searchText = '';

  // Data lists
  settingsList: ReminderSetting[] = [];
  filteredSettings: ReminderSetting[] = [];
  emailTemplates: EmailTemplate[] = [];

  // Dropdown options
  reminderTypes = ['LeaseExpiry', 'RentDue', 'Maintenance', 'ContractRenewal', 'Inspection'];

  // Modal / Form States
  showModal = false;
  isEditMode = false;
  isSaving = false;
  statusMessage = '';
  debugError = '';
  showTemplateDropdown = false;
  showReminderTypeDropdown = false;

  // Selected Model for Form
  selectedSetting: ReminderSetting = {
    id: undefined,
    reminderType: 'LeaseExpiry',
    daysBefore: 1,
    isActive: true,
    templateCode: ''
  };

  constructor(
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private elementRef: ElementRef
  ) {}

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

  showAlert(icon: string, title: string, text: string): void {
    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: 'var(--erp-primary, #30277C)'
      });
    }).catch(() => {
      alert(`${title}: ${text}`);
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ==========================================
  // FETCH SETTINGS & TEMPLATES
  // ==========================================
  loadInitialData(): void {
    // 1. Fetch templates first to populate dropdown descriptions
    this.reminderService.getEmailTemplates().subscribe({
      next: (templateResponse) => {
        this.ngZone.run(() => {
          this.emailTemplates = templateResponse?.data || templateResponse || [];
          
          // 2. Fetch reminder settings
          this.loadReminderSettings();
        });
      },
      error: (err) => {
        console.error('Failed to load email templates:', err);
        this.debugError = 'Error loading email templates details.';
        this.cdr.detectChanges();
      }
    });
  }

  loadReminderSettings(): void {
    this.reminderService.getReminderSettings().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.settingsList = response?.data || response || [];
          this.filterSettings();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load reminder settings:', err);
        this.debugError = 'Load API error: ' + (err.error?.message || err.message || JSON.stringify(err));
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // FILTER TABLE
  // ==========================================
  filterSettings(): void {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      this.filteredSettings = [...this.settingsList];
    } else {
      this.filteredSettings = this.settingsList.filter(s =>
        (s.reminderType || '').toLowerCase().includes(keyword) ||
        (s.templateCode || '').toLowerCase().includes(keyword)
      );
    }
    this.cdr.detectChanges();
  }

  // Get template display name for the table cell
  getTemplateDisplayName(code: string): string {
    const found = this.emailTemplates.find(t => t.templateCode === code);
    return found ? `${found.templateName} (${code})` : code;
  }

  // ==========================================
  // TOGGLE STATUS DIRECTLY FROM CARD
  // ==========================================
  toggleSettingStatus(setting: ReminderSetting): void {
    if (!setting.id) return;
    
    const previousStatus = setting.isActive;
    setting.isActive = !previousStatus;
    this.cdr.detectChanges();

    const payload: ReminderSetting = {
      reminderType: setting.reminderType,
      daysBefore: setting.daysBefore,
      isActive: setting.isActive,
      templateCode: setting.templateCode
    };

    this.reminderService.updateReminderSetting(setting.id, payload).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.statusMessage = 'Status updated successfully.';
          setTimeout(() => {
            this.ngZone.run(() => {
              this.statusMessage = '';
              this.cdr.detectChanges();
            });
          }, 3000);
          this.loadReminderSettings();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to toggle status:', err);
          setting.isActive = previousStatus;
          this.debugError = 'Failed to toggle status.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ==========================================
  // MODAL ACTIONS
  // ==========================================
  openAddModal(): void {
    this.isEditMode = false;
    this.debugError = '';
    this.showTemplateDropdown = false;
    this.showReminderTypeDropdown = false;
    this.selectedSetting = {
      id: undefined,
      reminderType: this.reminderTypes[0],
      daysBefore: 7,
      isActive: true,
      templateCode: this.emailTemplates.length > 0 ? this.emailTemplates[0].templateCode : ''
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(setting: ReminderSetting): void {
    this.isEditMode = true;
    this.debugError = '';
    this.showTemplateDropdown = false;
    this.showReminderTypeDropdown = false;
    this.selectedSetting = { ...setting };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.showTemplateDropdown = false;
    this.showReminderTypeDropdown = false;
    this.debugError = '';
    this.cdr.detectChanges();
  }

  // ==========================================
  // SAVE / SUBMIT SETTING
  // ==========================================
  saveSetting(): void {
    this.showTemplateDropdown = false;
    this.showReminderTypeDropdown = false;
    // Form Validations
    if (!this.selectedSetting.reminderType) {
      this.showAlert('warning', 'Input Required', 'Reminder Type is required.');
      return;
    }
    if (this.selectedSetting.daysBefore === null || this.selectedSetting.daysBefore === undefined) {
      this.showAlert('warning', 'Input Required', 'Days Before is required.');
      return;
    }
    if (!this.selectedSetting.templateCode) {
      this.showAlert('warning', 'Input Required', 'Template selection is required.');
      return;
    }

    if (this.isSaving) return;

    // Prepare Payload
    const payload: ReminderSetting = {
      reminderType: this.selectedSetting.reminderType,
      daysBefore: Number(this.selectedSetting.daysBefore),
      isActive: this.selectedSetting.isActive,
      templateCode: this.selectedSetting.templateCode
    };

    if (this.isEditMode) {
      payload.id = this.selectedSetting.id;
    }

    this.isSaving = true;
    this.statusMessage = this.isEditMode ? 'Saving changes...' : 'Adding reminder setting...';
    this.debugError = '';
    this.cdr.detectChanges();

    if (this.isEditMode && this.selectedSetting.id !== undefined) {
      this.reminderService.updateReminderSetting(this.selectedSetting.id, payload).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.statusMessage = 'Reminder rule updated successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            this.showModal = false;
            this.isSaving = false;
            this.showAlert('success', 'Updated Successfully', 'Reminder setting details have been updated.');
            this.loadReminderSettings();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to update reminder setting:', err);
            this.debugError = 'Update error: ' + (err.error?.message || err.message || JSON.stringify(err));
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
            this.showAlert('error', 'Update Failed', err.error?.message || 'Failed to update reminder setting.');
          });
        }
      });
    } else {
      this.reminderService.createReminderSetting(payload).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.statusMessage = 'Reminder rule added successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            this.showModal = false;
            this.isSaving = false;
            this.showAlert('success', 'Created Successfully', 'Reminder setting has been created successfully.');
            this.loadReminderSettings();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to create reminder setting:', err);
            this.debugError = 'Create error: ' + (err.error?.message || err.message || JSON.stringify(err));
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
            this.showAlert('error', 'Create Failed', err.error?.message || 'Failed to create reminder setting.');
          });
        }
      });
    }
  }

  // ==========================================
  // CUSTOM DROPDOWN HELPERS
  // ==========================================
  toggleTemplateDropdown(): void {
    if (this.isSaving) return;
    this.showTemplateDropdown = !this.showTemplateDropdown;
    this.cdr.detectChanges();
  }

  selectTemplate(code: string): void {
    this.selectedSetting.templateCode = code;
    this.showTemplateDropdown = false;
    this.cdr.detectChanges();
  }

  getSelectedTemplateDisplayName(): string {
    const code = this.selectedSetting.templateCode;
    if (!code) return 'Select Template';
    const found = this.emailTemplates.find(t => t.templateCode === code);
    return found ? `${found.templateName} (${code})` : code;
  }

  toggleReminderTypeDropdown(): void {
    if (this.isSaving) return;
    this.showReminderTypeDropdown = !this.showReminderTypeDropdown;
    this.cdr.detectChanges();
  }

  selectReminderType(type: string): void {
    this.selectedSetting.reminderType = type;
    this.showReminderTypeDropdown = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-btn') && !target.closest('.custom-dropdown-popup')) {
      this.showTemplateDropdown = false;
      this.showReminderTypeDropdown = false;
      this.cdr.detectChanges();
    }
  }
}