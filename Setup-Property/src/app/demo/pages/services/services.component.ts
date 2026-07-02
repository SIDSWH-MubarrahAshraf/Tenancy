import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
// ── Model ─────────────────────────────────────────────────────────────────────

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

// ── Seed records (swap ngOnInit body with API call) ────────────────────────
const SEED_RECORDS: ServiceTypeModel[] = [
  {
    id: 1,
    serviceType: 'SVC-001',
    description: 'Monthly residential rent collection and management.',
    revenueAccountCode: 'REV-4100',
    revenueAccountName: 'Rental Revenue',
    serviceMode: 'rent',
    recurringEntry: true,
    recurringAccountCode: 'REC-5500',
    recurringAccountName: 'Recurring Receivable',
    recurringFrequency: 'monthly',
    isActive: true,
  },
  {
    id: 2,
    serviceType: 'SVC-002',
    description: 'Property sale transaction processing.',
    revenueAccountCode: 'REV-4200',
    revenueAccountName: 'Sales Revenue',
    serviceMode: 'sale',
    recurringEntry: false,
    recurringAccountCode: '',
    recurringAccountName: '',
    recurringFrequency: '',
    isActive: true,
  },
  {
    id: 3,
    serviceType: 'SVC-003',
    description: 'Commercial property lease agreements.',
    revenueAccountCode: 'REV-4300',
    revenueAccountName: 'Lease Revenue',
    serviceMode: 'lease',
    recurringEntry: true,
    recurringAccountCode: 'REC-5600',
    recurringAccountName: 'Deferred Lease Income',
    recurringFrequency: 'quarterly',
    isActive: false,
  },
];

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnInit {
  constructor(private router: Router) {}

  // ── State ─────────────────────────────────────────────────────────────────
  records: ServiceTypeModel[] = [];
  currentIndex = 0;
  isNew = false;
  isActive = true;
  showClosePage = false;

  model: ServiceTypeModel = this.emptyModel();

  toast = { visible: false, message: '', type: 'success' as 'success' | 'danger' };
  private toastTimer: any;

  // ── Computed ──────────────────────────────────────────────────────────────
  /** True only when the selected service mode qualifies for recurring billing */
  get showRecurringSection(): boolean {
    return RECURRING_MODES.has(this.model.serviceMode);
  }

  get totalRecords(): number {
    return this.records.length;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // TODO: replace with this.serviceApiService.getAll().subscribe(...)
    this.records = JSON.parse(JSON.stringify(SEED_RECORDS));
    this.loadRecord(0);
  }

  // ── Service Mode change ───────────────────────────────────────────────────
  onServiceModeChange(): void {
    // Clear recurring fields when switching away from a recurring-eligible mode
    if (!this.showRecurringSection) {
      this.model.recurringEntry = false;
      this.model.recurringAccountCode = '';
      this.model.recurringAccountName = '';
      this.model.recurringFrequency = '';
    }
  }

  // ── Record navigation ─────────────────────────────────────────────────────
  navigateRecord(direction: 'first' | 'prev' | 'next' | 'last'): void {
    if (this.records.length === 0) return;
    switch (direction) {
      case 'first': this.currentIndex = 0; break;
      case 'prev':  this.currentIndex = Math.max(0, this.currentIndex - 1); break;
      case 'next':  this.currentIndex = Math.min(this.records.length - 1, this.currentIndex + 1); break;
      case 'last':  this.currentIndex = this.records.length - 1; break;
    }
    this.loadRecord(this.currentIndex);
  }

  private loadRecord(index: number): void {
    this.isNew = false;
    this.model = JSON.parse(JSON.stringify(this.records[index]));
    this.isActive = this.model.isActive;
  }

  // ── Active / Inactive ─────────────────────────────────────────────────────
  toggleActive(): void {
    this.isActive = !this.isActive;
    this.model.isActive = this.isActive;
  }

  /** "Update Status" button — saves only the active/inactive flag */
  onUpdateStatus(): void {
    if (this.isNew) {
      this.showToast('Save the record first before updating status.', 'danger');
      return;
    }
    this.model.isActive = this.isActive;
    this.records[this.currentIndex].isActive = this.isActive;
    // TODO: replace with API call -> serviceApiService.updateStatus(this.model.id, this.isActive)
    this.showToast(`Status updated to ${this.isActive ? 'Active' : 'Inactive'}.`, 'success');
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
    // TODO: open lookup modal and patch result back to model
    this.showToast(`${type === 'revenue' ? 'Revenue' : 'Recurring'} account lookup opened.`, 'success');
  }

  onSearch(): void {
    // TODO: open search / filter dialog
    this.showToast('Search opened.', 'success');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  onNew(): void {
    this.isNew = true;
    this.model = this.emptyModel();
    this.isActive = true;
    this.currentIndex = this.records.length;
    this.showToast('New record ready.', 'success');
  }

  onSave(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showToast('Please fill all required fields.', 'danger');
      return;
    }

    this.model.isActive = this.isActive;

    if (this.isNew) {
      // TODO: serviceApiService.create(this.model)
      const newRecord = { ...this.model, id: Date.now() };
      this.records.push(newRecord);
      this.currentIndex = this.records.length - 1;
      this.isNew = false;
      this.showToast('Record created successfully.', 'success');
    } else {
      // TODO: serviceApiService.update(this.model)
      this.records[this.currentIndex] = JSON.parse(JSON.stringify(this.model));
      this.showToast('Record saved successfully.', 'success');
    }
  }

  onDelete(): void {
    if (this.isNew || this.records.length === 0) return;

    const confirmed = window.confirm(
      `Delete service type "${this.model.serviceType}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    // TODO: serviceApiService.delete(this.model.id)
    this.records.splice(this.currentIndex, 1);

    if (this.records.length === 0) {
      this.onNew();
    } else {
      this.currentIndex = Math.min(this.currentIndex, this.records.length - 1);
      this.loadRecord(this.currentIndex);
    }
    this.showToast('Record deleted.', 'danger');
  }

  /** Close → show the landing / logo page */
  onClose(): void {
  this.router.navigate(['/blank']);
}

  /** Back button on the close page → return to the form */
  onBackFromClose(): void {
    this.showClosePage = false;
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
}