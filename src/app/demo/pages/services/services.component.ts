import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
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
    private cdr: ChangeDetectorRef
  ) {}

  // ── State ─────────────────────────────────────────────────────────────────
  selectedServiceId: number | null = null;
  showSearchPopup = false;
  loadingServices = false;
  dbServices: any[] = [];
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
      recurringEntry: uiModel.recurringEntry,
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

  // ── Search & Selection Dropdown Popup ─────────────────────────────────────
  toggleSearchPopup(): void {
    this.showSearchPopup = !this.showSearchPopup;
    if (this.showSearchPopup) {
      this.loadDbServices();
    }
  }

  loadDbServices(): void {
    const searchText = this.model.serviceType ? this.model.serviceType.trim().toLowerCase() : '';
    if (!searchText) {
      this.dbServices = [];
      this.showSearchPopup = false;
      this.showToast('Please enter a Service Type to search.', 'danger');
      return;
    }

    this.loadingServices = true;
    this.serviceTypeService.getAll().subscribe({
      next: (response) => {
        this.loadingServices = false;
        const allServices = response?.data || response || [];
        
        // Filter to ONLY show the service type that exactly matches what was entered
        this.dbServices = allServices.filter((svc: any) => 
          svc.serviceTypeCode?.trim().toLowerCase() === searchText
        );

        if (this.dbServices.length === 1) {
          // If exactly one match is found, auto-populate all fields and close popup
          this.selectServiceFromDb(this.dbServices[0]);
          this.showToast('Service details loaded.', 'success');
        } else {
          // Otherwise display dropdown search results
          this.showSearchPopup = true;
        }
      },
      error: (err) => {
        this.loadingServices = false;
        this.showSearchPopup = false;
        console.error('Failed to load services:', err);
        this.showToast('Failed to load services list.', 'danger');
      }
    });
  }

  selectServiceFromDb(svc: any): void {
    this.showSearchPopup = false;
    this.selectedServiceId = svc.id;
    this.model = this.toUiModel(svc);
    this.isActive = this.model.isActive;
  }

  // ── Service Mode change ───────────────────────────────────────────────────
  onServiceModeChange(): void {
    if (!this.showRecurringSection) {
      this.model.recurringEntry = false;
      this.model.recurringAccountCode = '';
      this.model.recurringAccountName = '';
      this.model.recurringFrequency = '';
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

  onSearch(): void {
    this.toggleSearchPopup();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  
  // POST: Save a new service type and then reset form
  saveNewService(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showToast('Please fill all required fields.', 'danger');
      return;
    }

    this.model.isActive = this.isActive;
    const payload = this.toApiModel(this.model);

    this.serviceTypeService.create(payload).subscribe({
      next: () => {
        this.showToast('Record created successfully.', 'success');
        this.clearForm(); // Refresh/clear all fields automatically
      },
      error: (err) => {
        console.error('Failed to create service type:', err);
        this.showToast(err.error?.message || 'Failed to create record.', 'danger');
      }
    });
  }

  // PUT: Save changes to an existing loaded service type
  saveChanges(form: NgForm): void {
    if (!this.selectedServiceId) {
      this.showToast('Please select a service using search first.', 'danger');
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showToast('Please fill all required fields.', 'danger');
      return;
    }

    this.model.isActive = this.isActive;
    const payload = this.toApiModel(this.model);

    this.serviceTypeService.update(this.selectedServiceId, payload).subscribe({
      next: (response) => {
        this.showToast('Changes saved successfully.', 'success');
        if (response && response.data) {
          this.model = this.toUiModel(response.data);
          this.isActive = this.model.isActive;
        } else {
          this.refreshLoadedService();
        }
      },
      error: (err) => {
        console.error('Failed to update service type:', err);
        this.showToast(err.error?.message || 'Failed to save changes.', 'danger');
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

    const confirmed = window.confirm(
      `Delete service type "${this.model.serviceType}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    this.serviceTypeService.delete(this.selectedServiceId).subscribe({
      next: () => {
        this.showToast('Record deleted successfully.', 'success');
        this.clearForm(); // Clears details and resets form controls
      },
      error: (err) => {
        console.error('Failed to delete service type:', err);
        this.showToast(err.error?.message || 'Failed to delete record.', 'danger');
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