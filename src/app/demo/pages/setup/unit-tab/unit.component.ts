import { Component, Input, OnInit, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { UnitService } from 'src/app/services/unit.service';
import { PropertyService } from 'src/app/services/property.service';
import { ServiceTypeService } from 'src/app/services/service-type.service';

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
  showUnitViewDropdown = false;
  showTaxAuthorityDropdown = false;
  showServiceTypeDropdown = false;

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
  serviceTypes: any[] = [];

  // Bulk Import state properties
  showBulkImportModal = false;
  selectedFile: File | null = null;
  importPreviewData: any[] = [];
  validationErrorsCount = 0;
  validationSuccessCount = 0;
  isImporting = false;
  importProgress = 0;
  importedCount = 0;
  importSummary: { total: number; success: number; failed: number } | null = null;
  headerValidationError: string | null = null;

  constructor(
    private unitService: UnitService,
    private propertyService: PropertyService,
    private serviceTypeService: ServiceTypeService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // If there is an active property selected, load it
    if (this.propertyId) {
      this.searchPropertyId = this.propertyId;
      this.loadUnitsForProperty(this.propertyId);
    }
    this.loadServiceTypes();
  }

  loadServiceTypes(): void {
    this.serviceTypeService.getAll().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        }
        this.serviceTypes = list;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load service types:', err);
      }
    });
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
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
  }

  toggleUnitPurposeDropdown(): void {
    this.showUnitPurposeDropdown = !this.showUnitPurposeDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
  }

  toggleUnitStatusDropdown(): void {
    this.showUnitStatusDropdown = !this.showUnitStatusDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
  }

  toggleUnitViewDropdown(): void {
    this.showUnitViewDropdown = !this.showUnitViewDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
  }

  toggleTaxAuthorityDropdown(): void {
    this.showTaxAuthorityDropdown = !this.showTaxAuthorityDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showUnitViewDropdown = false;
    this.showServiceTypeDropdown = false;
  }

  toggleServiceTypeDropdown(): void {
    this.showServiceTypeDropdown = !this.showServiceTypeDropdown;
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
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

  selectUnitView(view: string): void {
    this.unit.unitView = view;
    this.showUnitViewDropdown = false;
  }

  selectTaxAuthority(option: string): void {
    this.unit.taxAuthority = option;
    this.showTaxAuthorityDropdown = false;
  }

  selectServiceType(serviceType: string): void {
    this.unit.serviceType = serviceType;
    this.showServiceTypeDropdown = false;
  }

  // Property Search Popup Methods
  showPropertySearchPopup = false;
  searchPropertyQuery = '';
  loadingProperties = false;
  properties: any[] = [];
  filteredProperties: any[] = [];

  openPropertySearchModal(): void {
    this.showPropertySearchPopup = true;
    this.loadingProperties = true;
    this.properties = [];
    this.filteredProperties = [];

    this.propertyService.getProperties().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data; 
        } else if (Array.isArray(response)) {
          list = response;
        }
        this.properties = list;
        this.filterProperties();
        this.loadingProperties = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load properties for search popup:', err);
        this.loadingProperties = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterProperties(): void {
    const q = (this.searchPropertyQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredProperties = [...this.properties];
    } else {
      this.filteredProperties = this.properties.filter(p =>
        String(p.propertyId || '').toLowerCase().includes(q) ||
        String(p.propertyName || '').toLowerCase().includes(q) ||
        String(p.propertyType || '').toLowerCase().includes(q) ||
        String(p.propertyCity || '').toLowerCase().includes(q)
      );
    }
  }

  selectProperty(p: any): void {
    this.searchPropertyId = p.propertyId || '';
    this.showPropertySearchPopup = false;
    this.loadUnitsForProperty(this.searchPropertyId);
  }

  // Unit Search Popup Methods
  showUnitSearchPopup = false;

  openUnitSearchModal(): void {
    if (!this.searchPropertyId || !this.searchPropertyId.trim()) {
      this.showAlert('warning', 'Selection Required', 'Please select a Property ID first.');
      return;
    }
    this.showUnitSearchPopup = true;
    this.searchText = '';
    this.loadUnitsForProperty(this.searchPropertyId);
  }

  selectUnitFromPopup(row: any): void {
    this.editUnit(row);
    this.showUnitSearchPopup = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Dismiss all custom select dropdown menus if click is not inside form field
    if (!target.closest('.field')) {
      this.showUnitTypeDropdown = false;
      this.showUnitPurposeDropdown = false;
      this.showUnitStatusDropdown = false;
      this.showUnitViewDropdown = false;
      this.showTaxAuthorityDropdown = false;
      this.showServiceTypeDropdown = false;
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

  // Check if a property is active before performing modifications
  checkPropertyActive(propId: string, callback: () => void): void {
    this.propertyService.getProperties().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        } else if (response) {
          list = [response];
        }

        const match = list.find(p => String(p.propertyId || '').trim().toLowerCase() === propId.toLowerCase());
        
        if (match && match.inactive) {
          this.isSaving = false;
          this.statusMessage = '';
          this.showAlert('error', 'Validation Failed', `Cannot save unit. The property "${match.propertyName || propId}" is inactive.`);
          this.cdr.detectChanges();
          return;
        }

        callback();
      },
      error: (err) => {
        console.warn('Property status validation failed, letting it pass', err);
        callback();
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

    this.isSaving = true;
    this.statusMessage = 'Validating property status...';
    this.cdr.detectChanges();

    this.checkPropertyActive(propId, () => {
      this.proceedToAddUnit(propId);
    });
  }

  proceedToAddUnit(propId: string): void {
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
      taxAuthority: this.unit.taxAuthority || 'No',
      unitPurpose: this.unit.unitPurpose || '',
      unitDescription: '',
      unitSize: sizeNum,
      unitDewaPremiseNo: '',
      unitDefaultAmount: 0,
      unitAcCharge: parseFloat(this.unit.acCharge) || 0,
      unitElectricalCharge: parseFloat(this.unit.electricityCharge) || 0,
      otherServiceCharge: 0,
      others: '',
      deposit: parseFloat(this.unit.securityDeposit) || 0,
      targetRent: parseFloat(this.unit.proposedRent) || 0,
      actualRent: parseFloat(this.unit.actualRent) || 0,
      proposedAmount: parseFloat(this.unit.proposedRent) || 0,
      unitView: this.unit.unitView || '',
      parkingNumber: this.unit.parking || '',
      maintenanceDeposit: 0,
      annualRentMin: 0,
      annualRentMax: 0,
      status: this.unit.status || 'Vacant',
      remarks: '',
      customerId: this.unit.customerId || '',
      customerName: this.unit.customerName || '',
      fromPeriod: this.unit.fromPeriod || '',
      toPeriod: this.unit.toPeriod || '',
      serviceType: this.unit.serviceType || ''
    };

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
      taxAuthority: row.taxAuthority || 'No',
      unitPurpose: row.unitPurpose,
      unitSize: row.unitSize,
      parking: row.parking || row.parkingNumber || '',
      unitView: row.unitView || '',
      status: row.status || 'Vacant',
      acCharge: row.acCharge || row.unitAcCharge || 0,
      electricityCharge: row.electricityCharge || row.unitElectricalCharge || 0,
      customerId: row.customerId || '',
      customerName: row.customerName || '',
      fromPeriod: row.fromPeriod || '',
      toPeriod: row.toPeriod || '',
      serviceType: row.serviceType || '',
      actualRent: row.actualRent || 0,
      proposedRent: row.proposedRent || row.targetRent || row.proposedAmount || 0,
      securityDeposit: row.securityDeposit || row.deposit || 0
    };

    // Close any open custom select dropdown menus
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
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

    this.checkPropertyActive(propId, () => {
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
        taxAuthority: this.unit.taxAuthority || 'No',
        unitPurpose: this.unit.unitPurpose || '',
        unitDescription: '',
        unitSize: sizeNum,
        unitDewaPremiseNo: '',
        unitDefaultAmount: 0,
        unitAcCharge: parseFloat(this.unit.acCharge) || 0,
        unitElectricalCharge: parseFloat(this.unit.electricityCharge) || 0,
        otherServiceCharge: 0,
        others: '',
        deposit: parseFloat(this.unit.securityDeposit) || 0,
        targetRent: parseFloat(this.unit.proposedRent) || 0,
        actualRent: parseFloat(this.unit.actualRent) || 0,
        proposedAmount: parseFloat(this.unit.proposedRent) || 0,
        unitView: this.unit.unitView || '',
        parkingNumber: this.unit.parking || '',
        maintenanceDeposit: 0,
        annualRentMin: 0,
        annualRentMax: 0,
        status: this.unit.status || 'Vacant',
        remarks: '',
        customerId: this.unit.customerId || '',
        customerName: this.unit.customerName || '',
        fromPeriod: this.unit.fromPeriod || '',
        toPeriod: this.unit.toPeriod || '',
        serviceType: this.unit.serviceType || ''
      };

      this.unitService.update(this.editingUnitId!, payload).subscribe({
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
            this.showAlert('error', 'Update Failed', err.error?.message || err.message || 'Failed to update unit.');
            this.cdr.detectChanges();
          });
        }
      });
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

  openBulkImportModal(): void {
    this.resetImportState();
    this.showBulkImportModal = true;
  }

  closeBulkImportModal(): void {
    this.showBulkImportModal = false;
  }

  resetImportState(): void {
    this.selectedFile = null;
    this.importPreviewData = [];
    this.validationErrorsCount = 0;
    this.validationSuccessCount = 0;
    this.isImporting = false;
    this.importProgress = 0;
    this.importedCount = 0;
    this.importSummary = null;
    this.headerValidationError = null;
  }

  onFileChange(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
      this.parseExcelFile(this.selectedFile);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      this.parseExcelFile(this.selectedFile);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  parseExcelFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      import('xlsx').then(XLSX => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Read headers first to check format
        const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headersRow: any[] = sheetRows[0] || [];
        const actualHeaders = headersRow.map(h => String(h || '').trim());
        
        const requiredHeaders = ['Unit No', 'Floor', 'Type', 'Bedrooms', 'Bathrooms', 'Area', 'Rent', 'Status'];
        const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const missingHeaders = requiredHeaders.filter(req => 
          !actualHeaders.some(act => cleanStr(act) === cleanStr(req))
        );
        
        if (missingHeaders.length > 0) {
          this.headerValidationError = "Invalid Excel format. Please upload a file with the required columns: Unit No, Floor, Type, Bedrooms, Bathrooms, Area, Rent, Status.";
          this.importPreviewData = [];
          this.validationErrorsCount = 0;
          this.validationSuccessCount = 0;
          this.selectedFile = null;
          this.cdr.detectChanges();
          return;
        } else {
          this.headerValidationError = null;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);
        if (!rawRows || rawRows.length === 0) {
          this.showAlert('warning', 'Empty File', 'The uploaded Excel file contains no data rows.');
          this.selectedFile = null;
          return;
        }

        this.importPreviewData = rawRows.map((row, index) => {
          const rowNum = index + 2;
          
          const getVal = (keys: string[]): any => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              if (keys.some(k => cleanKey === k.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                return row[key];
              }
            }
            return undefined;
          };

          const unitNoVal = String(getVal(['unitno']) || '').trim();
          const bedroomsVal = getVal(['bedrooms']) !== undefined ? String(getVal(['bedrooms'])).trim() : '-';
          const bathroomsVal = getVal(['bathrooms']) !== undefined ? String(getVal(['bathrooms'])).trim() : '-';

          return {
            rowNum,
            unitId: unitNoVal, // Generate unitId from unitNo
            unitNo: unitNoVal,
            block: String(getVal(['block', 'blk']) || '').trim(),
            floor: String(getVal(['floor', 'flr']) || '').trim(),
            unitType: String(getVal(['unittype', 'type']) || '').trim(),
            unitPurpose: String(getVal(['unitpurpose', 'purpose']) || '').trim(),
            unitSize: getVal(['unitsize', 'size', 'area']),
            unitView: String(getVal(['unitview', 'view']) || '').trim(),
            parking: String(getVal(['parking', 'parkingnumber']) || '').trim(),
            status: String(getVal(['status']) || 'Vacant').trim(),
            taxAuthority: String(getVal(['taxauthority', 'tax']) || 'No').trim(),
            actualRent: getVal(['actualrent', 'rent']),
            proposedRent: getVal(['proposedrent', 'proposedamount', 'targetrent', 'rent']),
            securityDeposit: getVal(['securitydeposit', 'deposit']),
            acCharge: getVal(['accharge', 'unitaccharge']),
            electricityCharge: getVal(['electricitycharge', 'unitelectricalcharge']),
            serviceType: String(getVal(['servicetype']) || '').trim(),
            remarks: `Bedrooms: ${bedroomsVal}, Bathrooms: ${bathroomsVal}`,
            errors: [] as string[]
          };
        });

        this.validateImportData();
        this.cdr.detectChanges();
      }).catch(err => {
        console.error('Failed to parse Excel file:', err);
        this.showAlert('error', 'Parsing Failed', 'Failed to read the Excel file. Please ensure it is a valid .xlsx file.');
        this.selectedFile = null;
      });
    };
    reader.readAsArrayBuffer(file);
  }

  validateImportData(): void {
    this.validationErrorsCount = 0;
    this.validationSuccessCount = 0;

    const selectedPropId = this.searchPropertyId?.trim();
    const globalErrors: string[] = [];
    if (!selectedPropId) {
      globalErrors.push('No property is selected. Please select a property first.');
    }

    const seenUnitIds = new Set<string>();
    const seenUnitNos = new Set<string>();

    const dbUnitIds = new Set(this.units.map(u => String(u.unitId || '').toLowerCase().trim()));
    const dbUnitNos = new Set(this.units.map(u => String(u.unitNo || '').toLowerCase().trim()));

    this.importPreviewData.forEach(row => {
      const errors: string[] = [];

      if (globalErrors.length > 0) {
        errors.push(...globalErrors);
      }

      if (!row.unitId) {
        errors.push('Unit ID is required.');
      }
      if (!row.unitNo) {
        errors.push('Unit No is required.');
      }

      const checkNumeric = (val: any, fieldName: string) => {
        if (val !== undefined && val !== null && val !== '') {
          const num = Number(String(val).replace(/,/g, ''));
          if (isNaN(num)) {
            errors.push(`${fieldName} must be a number.`);
          }
        }
      };

      checkNumeric(row.unitSize, 'Unit Size');
      checkNumeric(row.actualRent, 'Actual Rent');
      checkNumeric(row.proposedRent, 'Proposed Rent');
      checkNumeric(row.securityDeposit, 'Security Deposit');
      checkNumeric(row.acCharge, 'AC Charge');
      checkNumeric(row.electricityCharge, 'Electricity Charge');

      if (row.unitId) {
        const idLower = row.unitId.toLowerCase();
        if (seenUnitIds.has(idLower)) {
          errors.push(`Duplicate Unit ID "${row.unitId}" within this file.`);
        } else {
          seenUnitIds.add(idLower);
        }
      }

      if (row.unitNo) {
        const noLower = row.unitNo.toLowerCase();
        if (seenUnitNos.has(noLower)) {
          errors.push(`Duplicate Unit No "${row.unitNo}" within this file.`);
        } else {
          seenUnitNos.add(noLower);
        }
      }

      if (row.unitId && dbUnitIds.has(row.unitId.toLowerCase())) {
        errors.push(`Unit ID "${row.unitId}" already exists in this property.`);
      }

      if (row.unitNo && dbUnitNos.has(row.unitNo.toLowerCase())) {
        errors.push(`Unit No "${row.unitNo}" already exists in this property.`);
      }

      row.errors = errors;
      if (errors.length > 0) {
        this.validationErrorsCount++;
      } else {
        this.validationSuccessCount++;
      }
    });
  }

  executeBulkImport(): void {
    if (this.validationErrorsCount > 0 || this.importPreviewData.length === 0) {
      return;
    }

    const propId = this.searchPropertyId?.trim();
    if (!propId) {
      this.showAlert('warning', 'Property Selection Required', 'Please select a property first.');
      return;
    }

    this.isImporting = true;
    this.importProgress = 0;
    this.importedCount = 0;
    this.importSummary = null;
    this.cdr.detectChanges();

    const totalToImport = this.importPreviewData.length;
    let successCount = 0;
    let failedCount = 0;

    const batchSize = 5;
    let currentIndex = 0;

    const processNextBatch = () => {
      if (currentIndex >= totalToImport) {
        this.isImporting = false;
        this.importSummary = {
          total: totalToImport,
          success: successCount,
          failed: failedCount
        };
        this.showAlert(
          failedCount === 0 ? 'success' : 'warning',
          'Import Complete',
          `${successCount} units imported successfully.` + (failedCount > 0 ? ` ${failedCount} units failed.` : '')
        );
        this.loadUnitsForProperty(propId);
        this.cdr.detectChanges();
        return;
      }

      const batchPromises: Promise<any>[] = [];
      const batchEnd = Math.min(currentIndex + batchSize, totalToImport);

      for (let i = currentIndex; i < batchEnd; i++) {
        const row = this.importPreviewData[i];
        
        let sizeNum = 0;
        if (row.unitSize) {
          const cleaned = String(row.unitSize).replace(/[^0-9]/g, '');
          sizeNum = parseInt(cleaned, 10) || 0;
        }

        const payload = {
          unitId: row.unitId,
          propertyId: propId,
          unitNo: row.unitNo || '',
          block: row.block || '',
          floor: row.floor || '',
          unitType: row.unitType || '',
          taxAuthority: row.taxAuthority || 'No',
          unitPurpose: row.unitPurpose || '',
          unitDescription: '',
          unitSize: sizeNum,
          unitDewaPremiseNo: '',
          unitDefaultAmount: 0,
          unitAcCharge: parseFloat(row.acCharge) || 0,
          unitElectricalCharge: parseFloat(row.electricityCharge) || 0,
          otherServiceCharge: 0,
          others: '',
          deposit: parseFloat(row.securityDeposit) || 0,
          targetRent: parseFloat(row.proposedRent) || 0,
          actualRent: parseFloat(row.actualRent) || 0,
          proposedAmount: parseFloat(row.proposedRent) || 0,
          unitView: row.unitView || '',
          parkingNumber: row.parking || '',
          maintenanceDeposit: 0,
          annualRentMin: 0,
          annualRentMax: 0,
          status: row.status || 'Vacant',
          remarks: '',
          customerId: '',
          customerName: '',
          fromPeriod: '',
          toPeriod: '',
          serviceType: row.serviceType || ''
        };

        const createPromise = new Promise<void>((resolve) => {
          this.unitService.create(payload).subscribe({
            next: () => {
              successCount++;
              this.importedCount++;
              this.importProgress = Math.round((this.importedCount / totalToImport) * 100);
              this.cdr.detectChanges();
              resolve();
            },
            error: (err) => {
              console.error(`Failed to import unit ${row.unitId}:`, err);
              failedCount++;
              this.importedCount++;
              this.importProgress = Math.round((this.importedCount / totalToImport) * 100);
              this.cdr.detectChanges();
              resolve();
            }
          });
        });
        batchPromises.push(createPromise);
      }

      currentIndex = batchEnd;
      Promise.all(batchPromises).then(() => {
        setTimeout(processNextBatch, 100);
      });
    };

    processNextBatch();
  }

  private emptyUnitModel(): any {
    this.showUnitTypeDropdown = false;
    this.showUnitPurposeDropdown = false;
    this.showUnitStatusDropdown = false;
    this.showUnitViewDropdown = false;
    this.showTaxAuthorityDropdown = false;
    this.showServiceTypeDropdown = false;
    return {
      unitId: '',
      unitNo: '',
      block: '',
      floor: '',
      unitType: '',
      taxAuthority: 'No',
      unitPurpose: '',
      unitSize: '',
      parking: '',
      unitView: '',
      status: 'Vacant',
      acCharge: 0,
      electricityCharge: 0,
      customerId: '',
      customerName: '',
      fromPeriod: '',
      toPeriod: '',
      serviceType: '',
      actualRent: 0,
      proposedRent: 0,
      securityDeposit: 0
    };
  }
}