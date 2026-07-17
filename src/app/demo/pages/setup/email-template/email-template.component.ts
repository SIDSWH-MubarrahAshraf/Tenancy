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
    this.loadAllTemplates();
  }

  // ==========================================
  // FETCH EMAIL TEMPLATES
  // ==========================================
  private isSeeding = false;

  checkAndSeedTemplates(templates: EmailTemplate[]): void {
    if (this.isSeeding) return;
    
    const hasMoveout = templates.some(t => t.templateCode === 'MOVEOUT_INSPECTION');
    const hasBounce = templates.some(t => t.templateCode === 'CHEQUE_BOUNCE');
    const hasReceipt = templates.some(t => t.templateCode === 'PAYMENT_RECEIPT');
    const hasExpiry = templates.some(t => t.templateCode === 'LEASE_EXPIRY_3MONTHS');
    const hasRentReminder = templates.some(t => t.templateCode === 'RENT_PAYMENT_REMINDER');
    
    if (!hasMoveout) {
      this.isSeeding = true;
      const defaultMoveout: EmailTemplate = {
        templateCode: 'MOVEOUT_INSPECTION',
        templateName: 'Move-Out Inspection and Key Handover Notice',
        subject: 'Move-Out Inspection and Key Handover Notice',
        bodyHtml: `<p>Dear <strong>{{tenantName}}</strong>,</p>\n` +
          `<p>This is to confirm that your move-out date for the property at <strong>Al Yazi Residence</strong> is <strong>{{moveOutDate}}</strong>.</p>\n` +
          `<p>As this notification is issued seven (7) days prior to the move-out date, please ensure that:</p>\n` +
          `<ul>\n` +
          `  <li>The apartment is cleaned and ready for inspection</li>\n` +
          `  <li>All keys are handed over on the same date</li>\n` +
          `  <li>TAQA clearance letter is provided prior to furniture removal</li>\n` +
          `</ul>\n` +
          `<p>Kindly confirm your availability to schedule the move out inspection and key handover.</p>\n` +
          `<p>Please note that the unit must be returned in accordance with the terms and conditions of the tenancy agreement.</p>\n` +
          `<p>For any inquiries, please contact us at <a href="mailto:Info@alzebq.com">Info@alzebq.com</a> or <a href="tel:0544551452">0544551452</a>.</p>\n` +
          `<p>Thank you for your cooperation.</p>\n` +
          `<p>Regards,<br><strong>Al Zebaq Real Estate</strong><br>Owner & management of Al Yazi Residence</p>\n` +
          `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">\n` +
          `<p style="font-size: 14px; color: #555;">\n` +
          `  <strong>Hassan Almutawaj</strong> | Property Manager<br>\n` +
          `  <strong>Al Zebaq Real Estate</strong><br>\n` +
          `  Mobile: +971 056 300 3007<br>\n` +
          `  Tel: +971 02 626 6888<br>\n` +
          `  Email: <a href="mailto:Hassan@Alzebaq.com">Hassan@Alzebaq.com</a><br>\n` +
          `  Office: 203/204, Al Montazah Tower B, Al Khalidiyah, Sheikh Zayed First Street, Abu Dhabi<br>\n` +
          `  <em>Al Zebaq Real Estate Investment</em>\n` +
          `</p>`,
        isActive: true
      };

      this.reminderService.createEmailTemplate(defaultMoveout).subscribe({
        next: () => {
          this.isSeeding = false;
          this.loadAllTemplates();
        },
        error: (err) => {
          this.isSeeding = false;
          console.error('Failed to auto-seed Move-Out Inspection email template:', err);
        }
      });
      return;
    }

    if (!hasBounce) {
      this.isSeeding = true;
      const defaultBounce: EmailTemplate = {
        templateCode: 'CHEQUE_BOUNCE',
        templateName: 'Cheque Bounce Notice',
        subject: 'Cheque Bounce Notice',
        bodyHtml: `<p>Dear <strong>{{tenantName}}</strong>,</p>\n` +
          `<p>I hope this message finds you well.</p>\n` +
          `<p>We regret to inform you that the cheque issued by you for rent payment (<strong>Cheque No. {{chequeNo}}</strong>), dated <strong>{{chequeDate}}</strong>, in the amount of <strong>{{chequeAmount}}</strong>, has been returned unpaid by the bank due to <strong>{{bounceReason}}</strong>.</p>\n` +
          `<p>As per the terms and conditions of the tenancy agreement, a penalty of 5% of the cheque amount in addition to AED 1,000 is applicable for returned cheques.</p>\n` +
          `<p>Accordingly, you are kindly requested to arrange immediate transfer of the rent amount along with the applicable penalty and any bank charges within five (5) days from the date of this notice.</p>\n` +
          `<p>Kindly treat this matter as urgent and confirm once payment has been completed. Failure to regularize the payment within the stated period may result in further action in accordance with the tenancy agreement and applicable regulations.</p>\n` +
          `<p>Should you require any clarification, please do not hesitate to contact us.</p>\n` +
          `<p>Kind Regards,<br><strong>Al Zebaq Real Estate Investment</strong><br>Owner & Managing of Al Yazi Residence</p>`,
        isActive: true
      };

      this.reminderService.createEmailTemplate(defaultBounce).subscribe({
        next: () => {
          this.isSeeding = false;
          this.loadAllTemplates();
        },
        error: (err) => {
          this.isSeeding = false;
          console.error('Failed to auto-seed Cheque Bounce email template:', err);
        }
      });
      return;
    }

    if (!hasReceipt) {
      this.isSeeding = true;
      const defaultReceipt: EmailTemplate = {
        templateCode: 'PAYMENT_RECEIPT',
        templateName: 'Payment Receipt Confirmation',
        subject: 'Payment Receipt Confirmation',
        bodyHtml: `<p>Dear <strong>{{tenantName}}</strong>,</p>\n` +
          `<p>Greetings from <strong>Al Yazi Residence</strong>.</p>\n` +
          `<p>This email is to acknowledge receipt of your payment. Please find the payment details below for your reference:</p>\n` +
          `<p>\n` +
          `  <strong>Receipt Number:</strong> {{receiptNo}}<br>\n` +
          `  <strong>Receipt Date:</strong> {{receiptDate}}<br>\n` +
          `  <strong>Payment Amount:</strong> {{paymentAmount}}\n` +
          `</p>\n` +
          `<p>We confirm that the above amount has been successfully received and recorded against your account. Thank you for your timely payment.</p>\n` +
          `<p>Should you require any clarification or additional documentation, please do not hesitate to contact us.</p>\n` +
          `<p>We appreciate your cooperation and continued association with Al Yazi Residence.</p>\n` +
          `<p>Sincerely,<br><strong>Al Yazi Residence</strong><br>Accounts Department</p>`,
        isActive: true
      };

      this.reminderService.createEmailTemplate(defaultReceipt).subscribe({
        next: () => {
          this.isSeeding = false;
          this.loadAllTemplates();
        },
        error: (err) => {
          this.isSeeding = false;
          console.error('Failed to auto-seed Payment Receipt email template:', err);
        }
      });
      return;
    }

    if (!hasExpiry) {
      this.isSeeding = true;
      const defaultExpiry: EmailTemplate = {
        templateCode: 'LEASE_EXPIRY_3MONTHS',
        templateName: 'Tenancy Expiry Reminder - 3 Months Notice',
        subject: 'Tenancy Expiry Reminder - 3 Months Notice',
        bodyHtml: `<p>Dear Sir/Madam,</p>\n` +
          `<p>Please be advised that your tenancy contract for the premises is due for renewal on <strong>{{renewalDate}}</strong>.</p>\n` +
          `<p>We are pleased to inform you that we are agreeable to renewing the tenancy contract for an additional one (1) year at an annual rent of <strong>{{annualRent}}</strong>, under the same existing terms and conditions.</p>\n` +
          `<p>Kindly confirm your acceptance at your earliest convenience in order for us to proceed with the renewal formalities in a timely manner.</p>\n` +
          `<p>Thank you for your cooperation.</p>\n` +
          `<p>Kind Regards,<br><strong>Al Zebaq Real Estate Investment</strong><br>Owner & Managing of Al Yazi Residence</p>`,
        isActive: true
      };

      this.reminderService.createEmailTemplate(defaultExpiry).subscribe({
        next: () => {
          this.isSeeding = false;
          this.loadAllTemplates();
        },
        error: (err) => {
          this.isSeeding = false;
          console.error('Failed to auto-seed Lease Expiry 3 Months Notice email template:', err);
        }
      });
      return;
    }

    if (!hasRentReminder) {
      this.isSeeding = true;
      const defaultRentReminder: EmailTemplate = {
        templateCode: 'RENT_PAYMENT_REMINDER',
        templateName: 'Rent Payment Reminder',
        subject: 'Rent Payment Reminder',
        bodyHtml: `<p>Dear <strong>{{tenantName}}</strong>,</p>\n` +
          `<p>I hope this message finds you well.</p>\n` +
          `<p>This is a friendly reminder that your rent cheque for <strong>{{unitNo}}</strong>, Al Yazi Residence is due on <strong>{{dueDate}}</strong> (in <strong>{{daysBefore}}</strong>).</p>\n` +
          `<p>Kindly ensure that the payment is arranged on or before the due date to avoid any inconvenience.</p>\n` +
          `<p>If the payment has already been processed, please disregard this reminder. Should you require any clarification, please do not hesitate to contact us.</p>\n` +
          `<p>Thank you for your prompt attention to this matter.</p>\n` +
          `<p>Kind Regards,<br><strong>Al Zebaq Real Estate Investment</strong><br>Owner & Managing of Al Yazi Residence</p>`,
        isActive: true
      };

      this.reminderService.createEmailTemplate(defaultRentReminder).subscribe({
        next: () => {
          this.isSeeding = false;
          this.loadAllTemplates();
        },
        error: (err) => {
          this.isSeeding = false;
          console.error('Failed to auto-seed Rent Payment Reminder email template:', err);
        }
      });
      return;
    }
  }

  loadAllTemplates(): void {
    this.reminderService.getEmailTemplates().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.templates = response?.data || response || [];
          this.filterTemplates();
          this.cdr.detectChanges();
          this.checkAndSeedTemplates(this.templates);
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
      this.showAlert('warning', 'Input Required', 'Template Code is required.');
      return;
    }
    if (!this.selectedTemplate.templateName.trim()) {
      this.showAlert('warning', 'Input Required', 'Template Name is required.');
      return;
    }
    if (!this.selectedTemplate.subject.trim()) {
      this.showAlert('warning', 'Input Required', 'Subject is required.');
      return;
    }
    if (!this.selectedTemplate.bodyHtml.trim()) {
      this.showAlert('warning', 'Input Required', 'Body HTML is required.');
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
            this.showAlert('success', 'Updated Successfully', 'Email template details have been updated.');
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
            this.showAlert('error', 'Update Failed', err.error?.message || 'Failed to update email template.');
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
            this.showAlert('success', 'Created Successfully', 'Email template has been created successfully.');
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
            this.showAlert('error', 'Create Failed', err.error?.message || 'Failed to create email template.');
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
    if (combined.includes('rent') || combined.includes('invoice') || combined.includes('payment') || combined.includes('due') || combined.includes('cheque') || combined.includes('bounce')) {
      return 'rentdue';
    }
    if (combined.includes('maintenance') || combined.includes('repair') || combined.includes('work')) {
      return 'maintenance';
    }
    if (combined.includes('renewal') || combined.includes('renew') || combined.includes('contract')) {
      return 'contractrenewal';
    }
    if (combined.includes('inspect') || combined.includes('audit') || combined.includes('moveout') || combined.includes('move-out')) {
      return 'inspection';
    }
    return 'default';
  }
}
