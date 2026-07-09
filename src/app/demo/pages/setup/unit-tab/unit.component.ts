import { Component, Input, OnInit, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { UnitService } from 'src/app/services/unit.service';

@Component({
  selector: 'app-unit',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss']
})
export class UnitComponent implements OnInit {
  // Input setter so that if a property is selected in the Property Tab,
  // it automatically fills searchPropertyId and loads its units.
  @Input() set propertyId(val: string) {
    this._propertyId = val;
    this.searchPropertyId = val;
    if (val) {
      this.loadUnitsForProperty(val);
    }
  }
  get propertyId(): string {
    return this._propertyId;
  }
  private _propertyId = '';

  // Local state properties
  searchPropertyId = '';
  searchText = '';

  // Custom dropdown states
  showUnitTypeDropdown = false;
  showUnitPurposeDropdown = false;
  showUnitStatusDropdown = false;

  // Edit Mode / Save states
  isEditMode = false;
  editingUnitId: number | null = null;
  statusMessage = '';

  // NEW: guards against double-submits so a second click can't fire a
  // duplicate request while the first one is still in flight.
  isSaving = false;

  unit: any = this.emptyUnitModel();
  units: any[] = [];
  filteredUnits: any[] = [];

  constructor(
    private unitService: UnitService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // If there is an active property selected, load it
    if (this.propertyId) {
      this.searchPropertyId = this.propertyId;
      this.loadUnitsForProperty(this.propertyId);
    }
  }

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

  // Dropdown toggle methods
  toggleUnitTypeDropdown(): void {
    this.showUnitTypeDropdown = !this.showUnitTypeDropdown;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
  }

  toggleUnitPurposeDropdown(): void {
    this.showUnitPurposeDropdown = !this.showUnitPurposeDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitStatusDropdown = false;
  }

  toggleUnitStatusDropdown(): void {
    this.showUnitStatusDropdown = !this.showUnitStatusDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
  }

  selectUnitType(type: string): void {
    this.unit.unitType = type;
    this.showUnitTypeDropdown = false;
  }

  selectUnitPurpose(purpose: string): void {
    this.unit.unitPurpose = purpose;
    this.showUnitPurposeDropdown = false;
  }

  selectUnitStatus(status: string): void {
    this.unit.status = status;
    this.showUnitStatusDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Dismiss all custom select dropdown menus if click is not inside form field
    if (!target.closest('.field')) {
      this.showUnitTypeDropdown = false;
      this.showUnitPurposeDropdown = false;
      this.showUnitStatusDropdown = false;
    }
  }

  // 1. Triggered by the search button next to Property ID field
  onPropertySearch(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      this.showAlert('warning', 'Input Required', 'Please enter a Property ID to search.');
      return;
    }
    this.loadUnitsForProperty(propId);
  }

  // 2. Fetch units registered under property ID from the database
  loadUnitsForProperty(propId: string): void {
    this.unitService.getByPropertyId(propId).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          // Map the backend data to your table rows (matching request/response schema)
          const dbList = response?.data || response || [];
          
          // Client-side guard: filter elements to strictly match the selected propertyId
          const filteredList = dbList.filter((item: any) => 
            String(item.propertyId || '').trim().toLowerCase() === propId.trim().toLowerCase()
          );

          this.units = filteredList.map((item: any, idx: number) => ({
            line: idx + 1,
            id: item.id, // Database ID
            unitId: item.unitId || '',
            unitNo: item.unitNo || '',
            block: item.block || '',
            floor: item.floor || '',
            unitType: item.unitType || '',
            taxAuthority: item.taxAuthority || '',
            unitPurpose: item.unitPurpose || '',
            description: item.unitDescription || '',
            unitSize: item.unitSize || '',
            dewaPrefix: item.unitDewaPremiseNo || '',
            defaultAccount: item.unitDefaultAmount || '',
            acCharge: item.unitAcCharge || 0,
            electricityCharge: item.unitElectricalCharge || 0,
            propertyId: item.propertyId,
            status: item.status || 'Vacant'
          }));
          this.filteredUnits = [...this.units];
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Failed to load units:', err);
          this.showAlert('error', 'Fetch Failed', 'Failed to load units for Property ID: ' + propId);
          this.units = [];
          this.filteredUnits = [];
          this.cdr.detectChanges();
        });
      }
    });
  }

  // 3. Add a new unit to the currently selected property
  addUnit(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      this.showAlert('warning', 'Input Required', 'Please select or fill a Property ID first.');
      return;
    }

    if (!this.unit.unitId) {
      this.showAlert('warning', 'Input Required', 'Unit ID is required.');
      return;
    }

    if (this.isSaving) return;

    // Clean and parse unitSize (e.g. "1,200 Sq Ft" -> 1200)
    let sizeNum = 0;
    if (this.unit.unitSize) {
      const cleaned = String(this.unit.unitSize).replace(/[^0-9]/g, '');
      sizeNum = parseInt(cleaned, 10) || 0;
    }

    // Map properties according to API contract to avoid 400 validation issues
    const payload = {
      unitId: this.unit.unitId,
      propertyId: propId,
      unitNo: this.unit.unitNo || '',
      block: this.unit.block || '',
      floor: this.unit.floor || '',
      unitType: this.unit.unitType || '',
      taxAuthority: this.unit.taxAuthority || '',
      unitPurpose: this.unit.unitPurpose || '',
      unitDescription: this.unit.description || '',
      unitSize: sizeNum,
      unitDewaPremiseNo: this.unit.dewaPrefix || '',
      unitDefaultAmount: parseFloat(this.unit.defaultAccount) || 0,
      unitAcCharge: parseFloat(this.unit.acCharge) || 0,
      unitElectricalCharge: parseFloat(this.unit.electricityCharge) || 0,
      otherServiceCharge: 0,
      others: '',
      deposit: 0,
      targetRent: 0,
      actualRent: 0,
      proposedAmount: 0,
      unitView: '',
      parkingNumber: '',
      maintenanceDeposit: 0,
      annualRentMin: 0,
      annualRentMax: 0,
      status: this.unit.status || 'Vacant',
      remarks: ''
    };

    this.isSaving = true;
    this.statusMessage = 'Adding unit...';
    this.cdr.detectChanges();

    this.unitService.create(payload).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          // Set success message exactly as requested
          this.statusMessage = 'Unit Added Successfully in property ID: ' + propId;
          setTimeout(() => {
            this.ngZone.run(() => {
              this.statusMessage = '';
              this.cdr.detectChanges();
            });
          }, 4000);
          this.showAlert('success', 'Added Successfully', 'Unit has been added successfully.');

          // Use whatever the backend returns (e.g. generated id), falling back
          // to what we sent if a field wasn't echoed back.
          const created = response?.data || response || {};

          const newUnitRow = {
            line: this.units.length + 1,
            id: created.id || Date.now(),
            unitId: created.unitId ?? payload.unitId,
            unitNo: created.unitNo ?? payload.unitNo,
            block: created.block ?? payload.block,
            floor: created.floor ?? payload.floor,
            unitType: created.unitType ?? payload.unitType,
            taxAuthority: created.taxAuthority ?? payload.taxAuthority,
            unitPurpose: created.unitPurpose ?? payload.unitPurpose,
            description: created.unitDescription ?? payload.unitDescription,
            unitSize: created.unitSize ?? payload.unitSize,
            dewaPrefix: created.unitDewaPremiseNo ?? payload.unitDewaPremiseNo,
            defaultAccount: created.unitDefaultAmount ?? payload.unitDefaultAmount,
            acCharge: created.unitAcCharge ?? payload.unitAcCharge,
            electricityCharge: created.unitElectricalCharge ?? payload.unitElectricalCharge,
            propertyId: propId
          };

          // Spread into a NEW array so Angular change detection picks it up immediately
          this.units = [...this.units, newUnitRow];
          this.filteredUnits = [...this.units];

          this.unit = this.emptyUnitModel();
          this.isSaving = false;
          this.cdr.detectChanges();

          // Refresh the table quietly from backend
          this.loadUnitsForProperty(propId);
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Failed to create unit:', err);
          this.showAlert('error', 'Add Failed', err.error?.message || err.message || 'Failed to create unit.');
          this.isSaving = false;
          this.statusMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // 4. Enter edit mode and populate form fields
  editUnit(row: any): void {
    this.isEditMode = true;
    this.editingUnitId = row.id;

    // Copy the selected unit properties into the form bind model
    this.unit = {
      unitId: row.unitId,
      unitNo: row.unitNo,
      block: row.block,
      floor: row.floor,
      unitType: row.unitType,
      taxAuthority: row.taxAuthority,
      unitPurpose: row.unitPurpose,
      description: row.description,
      unitSize: row.unitSize,
      dewaPrefix: row.dewaPrefix,
      defaultAccount: row.defaultAccount,
      acCharge: row.acCharge,
      electricityCharge: row.electricityCharge,
      status: row.status || 'Vacant'
    };

    // Close any open custom select dropdown menus
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.cdr.detectChanges();
  }

  // 5. Save edited changes on backend
  saveChanges(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      this.showAlert('warning', 'Input Required', 'Property ID is required.');
      return;
    }

    if (this.editingUnitId === null) {
      this.showAlert('warning', 'Selection Required', 'No unit selected for saving.');
      return;
    }

    let sizeNum = 0;
    if (this.unit.unitSize) {
      const cleaned = String(this.unit.unitSize).replace(/[^0-9]/g, '');
      sizeNum = parseInt(cleaned, 10) || 0;
    }

    const payload = {
      unitId: this.unit.unitId,
      propertyId: propId,
      unitNo: this.unit.unitNo || '',
      block: this.unit.block || '',
      floor: this.unit.floor || '',
      unitType: this.unit.unitType || '',
      taxAuthority: this.unit.taxAuthority || '',
      unitPurpose: this.unit.unitPurpose || '',
      unitDescription: this.unit.description || '',
      unitSize: sizeNum,
      unitDewaPremiseNo: this.unit.dewaPrefix || '',
      unitDefaultAmount: parseFloat(this.unit.defaultAccount) || 0,
      unitAcCharge: parseFloat(this.unit.acCharge) || 0,
      unitElectricalCharge: parseFloat(this.unit.electricityCharge) || 0,
      otherServiceCharge: 0,
      others: '',
      deposit: 0,
      targetRent: 0,
      actualRent: 0,
      proposedAmount: 0,
      unitView: '',
      parkingNumber: '',
      maintenanceDeposit: 0,
      annualRentMin: 0,
      annualRentMax: 0,
      status: this.unit.status || 'Vacant',
      remarks: ''
    };

    this.unitService.update(this.editingUnitId, payload).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          // Reset states and clear form
          this.isEditMode = false;
          this.editingUnitId = null;
          this.unit = this.emptyUnitModel();
          this.cdr.detectChanges();
          
          // Refresh the table automatically
          this.loadUnitsForProperty(propId);
          this.showAlert('success', 'Updated Successfully', 'Unit details have been updated.');
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Failed to update unit:', err);
          this.showAlert('error', 'Update Failed', err.error?.message || 'Failed to update unit.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  // 6. Abort editing and reset form
  cancelEdit(): void {
    this.isEditMode = false;
    this.editingUnitId = null;
    this.unit = this.emptyUnitModel();
    this.cdr.detectChanges();
  }

  filterUnits(): void {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      this.filteredUnits = [...this.units];
      this.cdr.detectChanges();
      return;
    }
    this.filteredUnits = this.units.filter(unit =>
      unit.unitId.toLowerCase().includes(search) ||
      unit.unitNo.toLowerCase().includes(search)
    );
    this.cdr.detectChanges();
  }

  deleteUnit(line: number): void {
    const matchedUnit = this.units.find(x => x.line === line);
    if (!matchedUnit || !matchedUnit.id) {
      // If it's a local unsaved unit row, just remove it from array
      this.units = this.units.filter(x => x.line !== line);
      this.filteredUnits = [...this.units];
      this.cdr.detectChanges();
      return;
    }

    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to delete unit "${matchedUnit.unitId}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--erp-danger, #C62828)',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.executeDeleteUnit(matchedUnit.id, line);
        }
      });
    });
  }

  executeDeleteUnit(id: number, line: number): void {
    this.unitService.delete(id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          // Optimistically remove from array for instant visual update
          this.units = this.units.filter(x => x.line !== line);
          this.filteredUnits = [...this.units];
          this.cdr.detectChanges();
          
          // Refresh with database to be perfectly synced
          this.loadUnitsForProperty(this.searchPropertyId);
          this.showAlert('success', 'Deleted Successfully', 'Unit has been deleted.');
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Failed to delete unit:', err);
          this.showAlert('error', 'Delete Failed', err.error?.message || 'Failed to delete unit.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  private emptyUnitModel(): any {
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    return {
      unitId: '',
      unitNo: '',
      block: '',
      floor: '',
      unitType: '',
      taxAuthority: '',
      unitPurpose: '',
      description: '',
      unitSize: '',
      dewaPrefix: '',
      defaultAccount: '',
      acCharge: 0,
      electricityCharge: 0,
      status: 'Vacant'
    };
  }
}