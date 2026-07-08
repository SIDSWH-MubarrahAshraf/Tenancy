import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from 'src/app/services/reminder.service';
import { EmailTemplate } from 'src/app/models/reminder.model';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss']
})
export class EmailTemplateComponent implements OnInit {

  // Search filter
  searchText = '';

  // Table Data
  templates: EmailTemplate[] = [];
  filteredTemplates: EmailTemplate[] = [];

  // Modal / Form States
  showModal = false;
  isEditMode = false;
  isSaving = false;
  statusMessage = '';
  debugError = '';

  // Selected Model for Form
  selectedTemplate: EmailTemplate = {
    id: undefined,
    templateCode: '',
    templateName: '',
    subject: '',
    bodyHtml: '',
    isActive: true
  };

  constructor(
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadAllTemplates();
  }

  // ==========================================
  // FETCH EMAIL TEMPLATES
  // ==========================================
  loadAllTemplates(): void {
    this.reminderService.getEmailTemplates().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.templates = response?.data || response || [];
          this.filterTemplates();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load email templates:', err);
        this.debugError = 'Load API error: ' + (err.error?.message || err.message || JSON.stringify(err));
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // FILTER TABLE
  // ==========================================
  filterTemplates(): void {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      this.filteredTemplates = [...this.templates];
    } else {
      this.filteredTemplates = this.templates.filter(t =>
        (t.templateCode || '').toLowerCase().includes(keyword) ||
        (t.templateName || '').toLowerCase().includes(keyword) ||
        (t.subject || '').toLowerCase().includes(keyword)
      );
    }
    this.cdr.detectChanges();
  }

  // ==========================================
  // MODAL ACTIONS
  // ==========================================
  openAddModal(): void {
    this.isEditMode = false;
    this.debugError = '';
    this.selectedTemplate = {
      id: undefined,
      templateCode: '',
      templateName: '',
      subject: '',
      bodyHtml: '',
      isActive: true
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(template: EmailTemplate): void {
    this.isEditMode = true;
    this.debugError = '';
    this.selectedTemplate = { ...template };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.debugError = '';
    this.cdr.detectChanges();
  }

  // ==========================================
  // SAVE / SUBMIT TEMPLATE
  // ==========================================
  saveTemplate(): void {
    // Form Validations
    if (!this.selectedTemplate.templateCode.trim()) {
      alert('Template Code is required.');
      return;
    }
    if (!this.selectedTemplate.templateName.trim()) {
      alert('Template Name is required.');
      return;
    }
    if (!this.selectedTemplate.subject.trim()) {
      alert('Subject is required.');
      return;
    }
    if (!this.selectedTemplate.bodyHtml.trim()) {
      alert('Body HTML is required.');
      return;
    }

    if (this.isSaving) return;

    // Prepare Payload (omitting audit fields as requested in guideline)
    const payload: EmailTemplate = {
      templateCode: this.selectedTemplate.templateCode.trim(),
      templateName: this.selectedTemplate.templateName.trim(),
      subject: this.selectedTemplate.subject.trim(),
      bodyHtml: this.selectedTemplate.bodyHtml,
      isActive: this.selectedTemplate.isActive
    };

    if (this.isEditMode) {
      payload.id = this.selectedTemplate.id;
    }

    this.isSaving = true;
    this.statusMessage = this.isEditMode ? 'Saving changes...' : 'Adding template...';
    this.debugError = '';
    this.cdr.detectChanges();

    if (this.isEditMode && this.selectedTemplate.id !== undefined) {
      this.reminderService.updateEmailTemplate(this.selectedTemplate.id, payload).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Template updated successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            this.showModal = false;
            this.isSaving = false;
            this.loadAllTemplates();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to update email template:', err);
            this.debugError = 'Update error: ' + (err.error?.message || err.message || JSON.stringify(err));
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.reminderService.createEmailTemplate(payload).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Template added successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            this.showModal = false;
            this.isSaving = false;
            this.loadAllTemplates();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to create email template:', err);
            this.debugError = 'Create error: ' + (err.error?.message || err.message || JSON.stringify(err));
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  // ==========================================
  // CATEGORIZE TEMPLATES FOR COLOR SHADING
  // ==========================================
  getTemplateType(templateCode: string, templateName: string): string {
    const combined = `${templateCode || ''} ${templateName || ''}`.toLowerCase();
    if (combined.includes('lease') || combined.includes('expire')) {
      return 'leaseexpiry';
    }
    if (combined.includes('rent') || combined.includes('invoice') || combined.includes('payment') || combined.includes('due')) {
      return 'rentdue';
    }
    if (combined.includes('maintenance') || combined.includes('repair') || combined.includes('work')) {
      return 'maintenance';
    }
    if (combined.includes('renewal') || combined.includes('renew') || combined.includes('contract')) {
      return 'contractrenewal';
    }
    if (combined.includes('inspect') || combined.includes('audit')) {
      return 'inspection';
    }
    return 'default';
  }
}
