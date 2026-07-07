import { Component, Input, OnInit } from '@angular/core';
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

  // Edit Mode / Save states
  isEditMode = false;
  editingUnitId: number | null = null;
  statusMessage = '';

  unit: any = this.emptyUnitModel();
  units: any[] = [];
  filteredUnits: any[] = [];

  constructor(private unitService: UnitService) {}

  ngOnInit(): void {
    // If there is an active property selected, load it
    if (this.propertyId) {
      this.searchPropertyId = this.propertyId;
      this.loadUnitsForProperty(this.propertyId);
    }
  }

  // Dropdown toggle methods
  toggleUnitTypeDropdown(): void {
    this.showUnitTypeDropdown = !this.showUnitTypeDropdown;
    this.showUnitPurposeDropdown = false;
  }

  toggleUnitPurposeDropdown(): void {
    this.showUnitPurposeDropdown = !this.showUnitPurposeDropdown;
    this.showUnitTypeDropdown = false;
  }

  selectUnitType(type: string): void {
    this.unit.unitType = type;
    this.showUnitTypeDropdown = false;
  }

  selectUnitPurpose(purpose: string): void {
    this.unit.unitPurpose = purpose;
    this.showUnitPurposeDropdown = false;
  }

  // 1. Triggered by the search button next to Property ID field
  onPropertySearch(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      alert('Please enter a Property ID to search.');
      return;
    }
    this.loadUnitsForProperty(propId);
  }

  // 2. Fetch units registered under property ID from the database
  loadUnitsForProperty(propId: string): void {
    this.unitService.getByPropertyId(propId).subscribe({
      next: (response: any) => {
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
          propertyId: item.propertyId
        }));
        this.filteredUnits = [...this.units];
      },
      error: (err: any) => {
        console.error('Failed to load units:', err);
        alert('Failed to load units for Property ID: ' + propId);
        this.units = [];
        this.filteredUnits = [];
      }
    });
  }

  // 3. Add a new unit to the currently selected property
  addUnit(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      alert('Please select or fill a Property ID first.');
      return;
    }

    if (!this.unit.unitId) {
      alert('Unit ID is required.');
      return;
    }

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
      status: 'Vacant',
      remarks: ''
    };

    this.unitService.create(payload).subscribe({
      next: (response: any) => {
        // Clear forms and close dropdowns
        this.unit = this.emptyUnitModel();
        // Immediately trigger reload from backend to refresh the table automatically
        this.loadUnitsForProperty(propId);
      },
      error: (err: any) => {
        console.error('Failed to create unit:', err);
        alert(err.error?.message || err.message || 'Failed to create unit.');
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
      electricityCharge: row.electricityCharge
    };

    // Close any open custom select dropdown menus
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
  }

  // 5. Save edited changes on backend
  saveChanges(): void {
    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      alert('Property ID is required.');
      return;
    }

    if (this.editingUnitId === null) {
      alert('No unit selected for saving.');
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
      status: 'Vacant',
      remarks: ''
    };

    this.unitService.update(this.editingUnitId, payload).subscribe({
      next: (response: any) => {
        // Reset states and clear form
        this.isEditMode = false;
        this.editingUnitId = null;
        this.unit = this.emptyUnitModel();
        
        // Refresh the table automatically
        this.loadUnitsForProperty(propId);
      },
      error: (err: any) => {
        console.error('Failed to update unit:', err);
        alert(err.error?.message || err.message || 'Failed to update unit.');
      }
    });
  }

  // 6. Abort editing and reset form
  cancelEdit(): void {
    this.isEditMode = false;
    this.editingUnitId = null;
    this.unit = this.emptyUnitModel();
  }

  filterUnits(): void {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      this.filteredUnits = [...this.units];
      return;
    }
    this.filteredUnits = this.units.filter(unit =>
      unit.unitId.toLowerCase().includes(search) ||
      unit.unitNo.toLowerCase().includes(search)
    );
  }

  deleteUnit(line: number): void {
    const matchedUnit = this.units.find(x => x.line === line);
    if (!matchedUnit || !matchedUnit.id) {
      // If it's a local unsaved unit row, just remove it from array
      this.units = this.units.filter(x => x.line !== line);
      this.filteredUnits = [...this.units];
      return;
    }

    const confirmed = window.confirm(`Delete unit "${matchedUnit.unitId}"?`);
    if (!confirmed) return;

    this.unitService.delete(matchedUnit.id).subscribe({
      next: () => {
        // Optimistically remove from array for instant visual update
        this.units = this.units.filter(x => x.line !== line);
        this.filteredUnits = [...this.units];
        
        // Refresh with database to be perfectly synced
        this.loadUnitsForProperty(this.searchPropertyId);
      },
      error: (err: any) => {
        console.error('Failed to delete unit:', err);
        alert(err.error?.message || 'Failed to delete unit.');
      }
    });
  }

  private emptyUnitModel(): any {
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
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
      electricityCharge: 0
    };
  }
}