import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmailSettingsService } from 'src/app/services/email-settings.service';
import { EmailSettings } from 'src/app/models/email-settings.model';

@Component({
  selector: 'app-email-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './email-setup.component.html',
  styleUrls: ['./email-setup.component.scss']
})
export class EmailSetupComponent implements OnInit {

  // ==========================================
  // MODEL
  // ==========================================
  email = {
    id: null as number | null,
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPassword: '',
    emailFromAddress: '',
    emailCcAddress: '', // Under the hood maps to fromName in the database
    enableSsl: true,
    testEmail: ''
  };

  // ==========================================
  // UX LOCK / SAVE / TESTING STATES
  // ==========================================
  isReadOnly = true; // Locks input fields initially if config is present
  isSaving = false;
  isTesting = false;
  statusMessage = '';

  // ==========================================
  // CONSTRUCTOR
  // ==========================================
  constructor(
    private emailService: EmailSettingsService,
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
    this.loadEmailSettings();
  }

  // ==========================================
  // FETCH SETTINGS ON LOAD
  // ==========================================
  loadEmailSettings(): void {
    this.emailService.getAll().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          const dbList = response?.data || response || [];
          if (dbList.length > 0) {
            const config = dbList[0]; // Global single SMTP setting
            this.email = {
              id: config.id,
              emailHost: config.smtpHost || '',
              emailPort: config.smtpPort || 587,
              emailUser: config.smtpUser || '',
              emailPassword: config.smtpPasswordEncrypted || '',
              emailFromAddress: config.fromEmail || '',
              emailCcAddress: config.fromName || '', // Map fromName to CC field
              enableSsl: config.enableSsl ?? true,
              testEmail: this.email.testEmail
            };
            this.isReadOnly = true; // Lock the loaded settings
          } else {
            this.isReadOnly = false; // Unlock if database is empty to allow initial entry
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load email configurations:', err);
        this.isReadOnly = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // ENABLE EDITING (UNLOCK FIELDS)
  // ==========================================
  enableEditing(): void {
    this.isReadOnly = false;
    this.cdr.detectChanges();
  }

  // ==========================================
  // CANCEL EDITING (LOCK & RELOAD)
  // ==========================================
  cancelEditing(): void {
    this.loadEmailSettings(); // Restores original settings from backend and locks inputs
  }

  // ==========================================
  // ADD (POST)
  // ==========================================
  saveEmailSetup(form: NgForm): void {
    if (form.invalid) {
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields.');
      return;
    }

    if (this.isSaving) return;

    const payload: EmailSettings = {
      smtpHost: this.email.emailHost.trim(),
      smtpPort: this.email.emailPort,
      smtpUser: this.email.emailUser.trim(),
      smtpPasswordEncrypted: this.email.emailPassword,
      fromEmail: this.email.emailFromAddress.trim(),
      fromName: this.email.emailCcAddress.trim(),
      enableSsl: this.email.enableSsl,
      isActive: true
    };

    this.isSaving = true;
    this.statusMessage = 'Adding email settings...';
    this.cdr.detectChanges();

    this.emailService.create(payload).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Email Settings Saved Successfully.';
          setTimeout(() => {
            this.ngZone.run(() => {
              this.statusMessage = '';
              this.cdr.detectChanges();
            });
          }, 4000);

          const created = response?.data || response || {};
          this.email.id = created.id;
          
          this.isSaving = false;
          this.isReadOnly = true; // Lock fields after successful create
          this.cdr.detectChanges();
          this.showAlert('success', 'Created Successfully', 'Email configuration has been created successfully.');
          
          // Silently sync settings from database
          this.loadEmailSettings();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to save email settings:', err);
          this.showAlert('error', 'Create Failed', err.error?.message || err.message || 'Failed to save email configuration.');
          this.isSaving = false;
          this.statusMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ==========================================
  // UPDATE (PUT)
  // ==========================================
  updateEmailSetup(): void {
    if (!this.email.id) {
      this.showAlert('warning', 'Selection Required', 'No email settings found to update. Fill the inputs and click Add first.');
      return;
    }

    if (this.isSaving) return;

    const payload: EmailSettings = {
      smtpHost: this.email.emailHost.trim(),
      smtpPort: this.email.emailPort,
      smtpUser: this.email.emailUser.trim(),
      smtpPasswordEncrypted: this.email.emailPassword,
      fromEmail: this.email.emailFromAddress.trim(),
      fromName: this.email.emailCcAddress.trim(),
      enableSsl: this.email.enableSsl,
      isActive: true
    };

    this.isSaving = true;
    this.statusMessage = 'Updating email settings...';
    this.cdr.detectChanges();

    this.emailService.update(this.email.id, payload).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Email Settings Updated Successfully.';
          setTimeout(() => {
            this.ngZone.run(() => {
              this.statusMessage = '';
              this.cdr.detectChanges();
            });
          }, 4000);

          this.isSaving = false;
          this.isReadOnly = true; // Lock fields after successful update
          this.cdr.detectChanges();
          this.showAlert('success', 'Updated Successfully', 'Email configuration has been updated.');

          // Silently sync settings from database
          this.loadEmailSettings();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to update email settings:', err);
          this.showAlert('error', 'Update Failed', err.error?.message || err.message || 'Failed to update email configuration.');
          this.isSaving = false;
          this.statusMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ==========================================
  // TEST EMAIL (POST)
  // ==========================================
  sendTestEmail(): void {
    if (!this.email.testEmail?.trim()) {
      this.showAlert('warning', 'Input Required', 'Please enter a Test Email Address.');
      return;
    }

    if (this.isTesting) return;

    const payload = {
      toEmail: this.email.testEmail.trim(),
      subject: 'SMTP Connection Test',
      body: 'Your tenancy application SMTP configuration is working successfully!'
    };

    this.isTesting = true;
    this.statusMessage = 'Sending test email...';
    this.cdr.detectChanges();

    this.emailService.test(payload).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.statusMessage = 'Test email sent successfully.';
          setTimeout(() => {
            this.ngZone.run(() => {
              this.statusMessage = '';
              this.cdr.detectChanges();
            });
          }, 4000);

          this.isTesting = false;
          this.cdr.detectChanges();
          this.showAlert('success', 'Test Email Sent', 'Test connection succeeded! Please check your inbox.');
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Failed to send test email:', err);
          this.showAlert('error', 'Test Failed', err.error?.message || err.message || 'Test connection failed. Verify host, port, credentials, and SSL settings.');
          this.isTesting = false;
          this.statusMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ==========================================
  // RESET
  // ==========================================
  resetForm(): void {
    this.email = {
      id: null,
      emailHost: '',
      emailPort: 587,
      emailUser: '',
      emailPassword: '',
      emailFromAddress: '',
      emailCcAddress: '',
      enableSsl: true,
      testEmail: ''
    };
    this.isReadOnly = false;
    this.cdr.detectChanges();
  }
}