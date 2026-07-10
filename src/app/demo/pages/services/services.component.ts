import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceTypeService } from 'src/app/services/service-type.service';

// ── UI Model used by component bindings ─────────────────────────────────────────
export interface ServiceTypeModel {
  id: number | null;
  serviceType: string;
  description: string;
  revenueAccountCode: string;
  revenueAccountName: string;
  serviceMode: string;
  recurringEntry: boolean;
  recurringAccountCode: string;
  recurringAccountName: string;
  recurringFrequency: string;
  isActive: boolean;
}

// ── Modes that expose the recurring section ────────────────────────────────
const RECURRING_MODES = new Set(['rent']);

// ── Dummy account lookup map (replace with real API service) ──────────────
const ACCOUNT_MAP: Record<string, string> = {
  'REV-4100': 'Rental Revenue',
  'REV-4200': 'Sales Revenue',
  'REV-4300': 'Lease Revenue',
  'REC-5500': 'Recurring Receivable',
  'REC-5600': 'Deferred Lease Income',
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnInit {
  @ViewChild('serviceForm') serviceForm?: NgForm;
  
  constructor(
    private router: Router,
    private serviceTypeService: ServiceTypeService,
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

  // ── State ─────────────────────────────────────────────────────────────────
  selectedServiceId: number | null = null;
  showSearchPopup = false;
  loadingServices = false;
  dbServices: any[] = [];
  searchQuery = '';
  filteredServices: any[] = [];
  showServiceModeDropdown = false;
  serviceModes = [
    { value: 'rent', label: 'Rent' },
    { value: 'subscription', label: 'Utility' },
    { value: 'maintenance', label: 'Miscellaneous' },
    { value: 'sale', label: 'Security Deposit' },
    { value: 'lease', label: 'Penalty' }
  ];

  model: ServiceTypeModel = this.emptyModel();
  isActive = true;

  toast = { visible: false, message: '', type: 'success' as 'success' | 'danger' };
  private toastTimer: any;

  // ── Computed ──────────────────────────────────────────────────────────────
  get showRecurringSection(): boolean {
    return RECURRING_MODES.has(this.model.serviceMode);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.clearForm();
  }

  // ── API Mapping Logic ─────────────────────────────────────────────────────
  private toApiModel(uiModel: ServiceTypeModel): any {
    return {
      serviceTypeCode: uiModel.serviceType,
      description: uiModel.description,
      revenueAccount: uiModel.revenueAccountCode,
      revenueAccountName: uiModel.revenueAccountName,
      recurringEntry: uiModel.serviceMode === 'rent',
      recurringAccount: uiModel.recurringAccountCode,
      recurringAccountName: uiModel.recurringAccountName,
      serviceMode: uiModel.serviceMode,
      active: uiModel.isActive
    };
  }

  private toUiModel(apiModel: any): ServiceTypeModel {
    return {
      id: apiModel.id,
      serviceType: apiModel.serviceTypeCode || '',
      description: apiModel.description || '',
      revenueAccountCode: apiModel.revenueAccount || '',
      revenueAccountName: apiModel.revenueAccountName || '',
      serviceMode: apiModel.serviceMode || '',
      recurringEntry: !!apiModel.recurringEntry,
      recurringAccountCode: apiModel.recurringAccount || '',
      recurringAccountName: apiModel.recurringAccountName || '',
      recurringFrequency: 'monthly',
      isActive: !!apiModel.active
    };
  }

  searchService(): void {
    const searchText = this.model.serviceType ? this.model.serviceType.trim().toLowerCase() : '';
    if (!searchText) {
      this.showAlert('warning', 'Input Required', 'Please enter a Service Type to search.');
      return;
    }

    this.loadingServices = true;
    this.cdr.detectChanges();

    this.serviceTypeService.getAll().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.loadingServices = false;
          const allServices = response?.data || response || [];
          
          // Find exact match case-insensitive
          const match = allServices.find((svc: any) => 
            String(svc.serviceTypeCode || '').trim().toLowerCase() === searchText
          );

          if (match) {
            this.selectServiceFromDb(match);
          } else {
            this.showAlert('error', 'Not Found', `Service Type "${this.model.serviceType}" was not found in the database.`);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.loadingServices = false;
          console.error('Failed to search services:', err);
          this.showAlert('error', 'Search Failed', 'Failed to retrieve service type data. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  selectServiceFromDb(svc: any): void {
    this.showSearchPopup = false;
    this.selectedServiceId = svc.id;
    this.model = this.toUiModel(svc);
    this.isActive = this.model.isActive;
    this.cdr.detectChanges();
  }

  openSearchPopup(): void {
    this.showSearchPopup = true;
    this.loadingServices = true;
    this.dbServices = [];
    this.filteredServices = [];
    this.searchQuery = '';
    this.cdr.detectChanges();

    this.serviceTypeService.getAll().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        }
        this.dbServices = list;
        this.filterServices();
        this.loadingServices = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load services for search popup:', err);
        this.loadingServices = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterServices(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredServices = [...this.dbServices];
    } else {
      this.filteredServices = this.dbServices.filter(s =>
        String(s.serviceTypeCode || '').toLowerCase().includes(q) ||
        String(s.description || '').toLowerCase().includes(q) ||
        String(s.serviceMode || '').toLowerCase().includes(q)
      );
    }
  }

  selectService(svc: any): void {
    this.selectServiceFromDb(svc);
    this.showSearchPopup = false;
  }

  // ── Service Mode change ───────────────────────────────────────────────────
  onServiceModeChange(): void {
    if (this.model.serviceMode !== 'rent') {
      this.model.revenueAccountCode = '';
      this.model.revenueAccountName = '';
      this.model.recurringAccountCode = '';
      this.model.recurringAccountName = '';
      this.model.recurringEntry = false;
    } else {
      this.model.recurringEntry = true;
    }
  }

  // ── Active / Inactive ─────────────────────────────────────────────────────
  toggleActive(): void {
    this.isActive = !this.isActive;
    this.model.isActive = this.isActive;
  }

  // ── Account lookup ────────────────────────────────────────────────────────
  resolveAccountName(type: 'revenue' | 'recurring'): void {
    if (type === 'revenue') {
      const code = this.model.revenueAccountCode?.trim().toUpperCase();
      this.model.revenueAccountName = ACCOUNT_MAP[code] ?? '';
    } else {
      const code = this.model.recurringAccountCode?.trim().toUpperCase();
      this.model.recurringAccountName = ACCOUNT_MAP[code] ?? '';
    }
  }

  onLookup(type: 'revenue' | 'recurring'): void {
    this.showToast(`${type === 'revenue' ? 'Revenue' : 'Recurring'} account lookup opened.`, 'success');
  }


  // ── CRUD ──────────────────────────────────────────────────────────────────
  
  // POST: Save a new service type and then reset form
  saveNewService(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields.');
      return;
    }

    this.model.isActive = this.isActive;
    const payload = this.toApiModel(this.model);

    this.serviceTypeService.create(payload).subscribe({
      next: () => {
        this.clearForm(); // Refresh/clear all fields automatically
        this.showAlert('success', 'Created Successfully', 'Service has been created successfully.');
      },
      error: (err) => {
        console.error('Failed to create service type:', err);
        this.showAlert('error', 'Create Failed', err.error?.message || 'Failed to create record.');
      }
    });
  }

  // PUT: Save changes to an existing loaded service type
  saveChanges(form: NgForm): void {
    if (!this.selectedServiceId) {
      this.showAlert('warning', 'Selection Required', 'Please select a service using search first.');
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields.');
      return;
    }

    // Verify service is active in the database before allowing updates
    this.serviceTypeService.getById(this.selectedServiceId).subscribe({
      next: (response) => {
        const data = response?.data || response;
        if (data && !data.active) {
          this.showAlert('error', 'Validation Failed', `Cannot modify service. The service "${data.serviceTypeCode || this.model.serviceType}" is inactive.`);
          // Revert local view state to match database record
          this.model = this.toUiModel(data);
          this.isActive = this.model.isActive;
          this.cdr.detectChanges();
          return;
        }

        this.proceedToSaveChanges(form);
      },
      error: (err) => {
        console.warn('Service status verification failed, proceeding to save', err);
        this.proceedToSaveChanges(form);
      }
    });
  }

  private proceedToSaveChanges(form: NgForm): void {
    this.model.isActive = this.isActive;
    const payload = this.toApiModel(this.model);

    this.serviceTypeService.update(this.selectedServiceId!, payload).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.model = this.toUiModel(response.data);
          this.isActive = this.model.isActive;
        } else {
          this.refreshLoadedService();
        }
        this.showAlert('success', 'Updated Successfully', 'Service details have been updated.');
      },
      error: (err) => {
        console.error('Failed to update service type:', err);
        this.showAlert('error', 'Update Failed', err.error?.message || 'Failed to save changes.');
      }
    });
  }

  private refreshLoadedService(): void {
    if (!this.selectedServiceId) return;
    this.serviceTypeService.getById(this.selectedServiceId).subscribe({
      next: (response) => {
        const data = response?.data || response;
        if (data) {
          this.model = this.toUiModel(data);
          this.isActive = this.model.isActive;
        }
      }
    });
  }

  onDelete(): void {
    if (!this.selectedServiceId) return;

    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to delete service type "${this.model.serviceType}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--erp-danger, #C62828)',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.executeDelete();
        }
      });
    });
  }

  executeDelete(): void {
    this.serviceTypeService.delete(this.selectedServiceId!).subscribe({
      next: () => {
        this.clearForm(); // Clears details and resets form controls
        this.showAlert('success', 'Deleted Successfully', 'Service record has been deleted.');
      },
      error: (err) => {
        console.error('Failed to delete service type:', err);
        this.showAlert('error', 'Delete Failed', err.error?.message || 'Failed to delete record.');
      }
    });
  }

  // Clear/refresh form fields
  clearForm(form?: NgForm): void {
    this.selectedServiceId = null;
    this.model = this.emptyModel();
    this.isActive = true;
    this.showSearchPopup = false;
    this.showServiceModeDropdown = false;
    
    const activeForm = form || this.serviceForm;
    if (activeForm) {
      activeForm.resetForm({
        serviceMode: '',
        serviceType: '',
        description: '',
        revenueAccountCode: '',
        recurringEntry: false,
        recurringAccountCode: ''
      });
      // Explicit reset safety check
      this.model = this.emptyModel();
    }
  }

  onClose(): void {
    this.router.navigate(['/blank']);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyModel(): ServiceTypeModel {
    return {
      id: null,
      serviceType: '',
      description: '',
      revenueAccountCode: '',
      revenueAccountName: '',
      serviceMode: '',
      recurringEntry: false,
      recurringAccountCode: '',
      recurringAccountName: '',
      recurringFrequency: '',
      isActive: true,
    };
  }

  showToast(message: string, type: 'success' | 'danger'): void {
    clearTimeout(this.toastTimer);
    this.toast = { visible: true, message, type };
    this.toastTimer = setTimeout(() => (this.toast.visible = false), 3000);
  }

  // ── Custom Dropdown Helpers ───────────────────────────────────────────────
  toggleServiceModeDropdown(): void {
    this.showServiceModeDropdown = !this.showServiceModeDropdown;
    this.cdr.detectChanges();
  }

  selectServiceMode(value: string): void {
    this.model.serviceMode = value;
    this.showServiceModeDropdown = false;
    this.onServiceModeChange();
    this.cdr.detectChanges();
  }

  getServiceModeLabel(): string {
    const mode = this.serviceModes.find(m => m.value === this.model.serviceMode);
    return mode ? mode.label : 'Select Service Mode';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-btn') && !target.closest('.custom-dropdown-popup')) {
      this.showServiceModeDropdown = false;
      this.cdr.detectChanges();
    }
  }
}