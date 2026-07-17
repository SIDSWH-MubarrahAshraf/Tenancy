import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OfferLetterService } from 'src/app/services/offer-letter.service';
import { UnitService } from 'src/app/services/unit.service';
import { PropertyService } from 'src/app/services/property.service';

interface OfferLetterModel {
  custName: string;
  custCode: string; // Email
  rent: string;
  valid: string; // Validity
  nobed: string; // Number of beds
  unitId: string;
  
  // Hidden metadata fields
  landlordName: string;
  property: string;
  refNo: string;
  unitno: string;
  unitnr: string;
  unitIdHidden: string;
  area: string;
  plotsize: string;
  plotno: string;
  makani: string;
  floor: string;
  buildname: string;
}

@Component({
  selector: 'app-offer-letter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offer-letter.component.html',
  styleUrls: ['./offer-letter.component.scss']
})
export class OfferLetterComponent implements OnInit {
  private offerLetterService = inject(OfferLetterService);
  private unitService = inject(UnitService);
  private propertyService = inject(PropertyService);
  private cdr = inject(ChangeDetectorRef);

  // Main Form Model
  model: OfferLetterModel = {
    custName: '',
    custCode: '',
    rent: '',
    valid: '',
    nobed: '',
    unitId: '',
    landlordName: '',
    property: '',
    refNo: '',
    unitno: '',
    unitnr: '',
    unitIdHidden: '',
    area: '',
    plotsize: '',
    plotno: '',
    makani: '',
    floor: '',
    buildname: ''
  };

  // State Management
  isGenerating = false;
  showModal = false;
  isLoadingUnits = false;

  // Unit List & Search/Sort/Pagination
  units: any[] = [];
  filteredUnits: any[] = [];
  searchTerm = '';
  sortColumn = 'unitId';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  ngOnInit(): void {}

  // ─── LOAD UNIT LIST IN MODAL ───────────────────────────────────────────
  openUnitPicker(): void {
    this.showModal = true;
    this.isLoadingUnits = true;
    this.units = [];
    this.filteredUnits = [];
    this.searchTerm = '';
    
    forkJoin({
      properties: this.propertyService.getProperties(),
      units: this.unitService.getAll()
    }).subscribe({
      next: (res) => {
        try {
          this.isLoadingUnits = false;
          
          const propsData = res.properties?.data || res.properties || [];
          const propsList = Array.isArray(propsData) ? propsData : [];
          
          const unitsData = res.units?.data || res.units || [];
          const unitsList = Array.isArray(unitsData) ? unitsData : [];

          // Map and join properties in memory
          this.units = unitsList.map((item: any, idx: number) => {
            const matchedProperty = propsList.find(p => 
              String(p.propertyId || '').trim().toLowerCase() === String(item.propertyId || '').trim().toLowerCase()
            ) || {};

            return {
              line: idx + 1,
              id: item.id,
              unitId: item.unitId || '',
              unitNo: item.unitNo || '',
              block: item.block || '',
              floor: item.floor || '',
              unitType: item.unitType || '',
              unitPurpose: item.unitPurpose || '',
              unitSize: item.unitSize || '',
              acCharge: item.unitAcCharge || 0,
              electricityCharge: item.unitElectricalCharge || 0,
              propertyId: item.propertyId,
              status: item.status || 'Vacant',
              property: {
                propertyName: matchedProperty.propertyName || '',
                propertyArea: matchedProperty.propertyArea || '',
                plotNo: matchedProperty.plotNo || '',
                propertyMakani: matchedProperty.propertyMakani || ''
              }
            };
          });

          this.applyFilterAndPagination();
          this.cdr.detectChanges();
        } catch (e) {
          this.isLoadingUnits = false;
          console.error('Error rendering unit picker list:', e);
          alert('Error rendering unit picker: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
      },
      error: (err) => {
        this.isLoadingUnits = false;
        console.error('Failed to load lookup data:', err);
        alert('Failed to load unit list. Please try again.');
      }
    });
  }

  closeUnitPicker(): void {
    this.showModal = false;
  }

  applyFilterAndPagination(): void {
    let result = [...this.units].filter(u => u != null);

    // Filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(u => {
        const prop = u.property || {};
        return String(u.unitId || u.id || '').toLowerCase().includes(term) ||
          String(u.unitNo || '').toLowerCase().includes(term) ||
          String(u.propertyId || '').toLowerCase().includes(term) ||
          String(prop.propertyName || '').toLowerCase().includes(term) ||
          String(prop.propertyArea || '').toLowerCase().includes(term) ||
          String(prop.propertyMakani || '').toLowerCase().includes(term);
      });
    }

    // Sort
    if (this.sortColumn) {
      result.sort((a, b) => {
        let valA = '';
        let valB = '';

        if (this.sortColumn === 'propertyName') {
          valA = String(a.property?.propertyName || '').toLowerCase();
          valB = String(b.property?.propertyName || '').toLowerCase();
        } else if (this.sortColumn === 'propertyArea') {
          valA = String(a.property?.propertyArea || '').toLowerCase();
          valB = String(b.property?.propertyArea || '').toLowerCase();
        } else if (this.sortColumn === 'plotNo') {
          valA = String(a.property?.plotNo || '').toLowerCase();
          valB = String(b.property?.plotNo || '').toLowerCase();
        } else if (this.sortColumn === 'propertyMakani') {
          valA = String(a.property?.propertyMakani || '').toLowerCase();
          valB = String(b.property?.propertyMakani || '').toLowerCase();
        } else {
          valA = a[this.sortColumn] != null ? String(a[this.sortColumn]).toLowerCase() : '';
          valB = b[this.sortColumn] != null ? String(b[this.sortColumn]).toLowerCase() : '';
        }

        // Try parsing numeric values for ID sorting
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return this.sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination Calculation
    this.totalPages = Math.ceil(result.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredUnits = result.slice(startIndex, startIndex + this.pageSize);
  }

  setSort(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilterAndPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilterAndPagination();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  // ─── ROW SELECT: FILL FIELDS ──────────────────────────────────────────
  selectUnit(user: any): void {
    const prop = user.property || {};
    
    this.model.unitId = user.unitId || String(user.id || '');
    this.model.unitIdHidden = user.unitId || String(user.id || '');
    this.model.unitnr = user.unitNo || '';
    this.model.unitno = user.unitNo || '';
    this.model.landlordName = prop.landlordName || 'Al Zebaq';
    this.model.property = user.propertyId || '';
    this.model.buildname = prop.propertyName || 'Al Yazi Residence';
    this.model.area = prop.propertyArea || 'Al Khalidiyah';
    this.model.plotsize = String(user.unitSize || '0');
    this.model.plotno = prop.plotNo || '';
    this.model.makani = prop.propertyMakani || '';
    this.model.floor = user.floor || '';
    
    this.closeUnitPicker();
    this.cdr.detectChanges();
  }

  // ─── GENERATE AND PRINT PDF CONTRACT ──────────────────────────────────
  printContract(): void {
    if (this.isGenerating) return;

    const name = this.model.custName.trim();
    const email = this.model.custCode.trim();
    const rent = this.model.rent.trim();
    const valid = this.model.valid.trim();
    const unitid = this.model.unitId.trim();

    if (!name || !email || !rent || !valid || !unitid) {
      alert('Please fill out all mandatory fields: Customer Name, Customer Email, Annual Rent, Validity, and Unit ID.');
      return;
    }

    this.isGenerating = true;

    // 1. Get Document Number List
    this.offerLetterService.getDocNumList({ COPERATION: 1, MODULE: 'OFFERLETTER' }).subscribe({
      next: (docDataRes) => {
        const docData = docDataRes?.data || docDataRes || {};
        const lastNumber = docData.number || 0;
        const newNumber = lastNumber + 1;

        // Generate Reference Number: ZQ{yy}/{mm}/{num}-{ts}
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const num = String(newNumber).padStart(3, '0');
        const ts = String(Date.now()).slice(-4);
        const generatedRefNo = `ZQ${yy}/${mm}/${num}-${ts}`;

        this.model.refNo = generatedRefNo;

        // 2. Post Document Number List (Reserve Number)
        this.offerLetterService.postDocNumList({
          COPERATION: 2,
          MODULE: 'OFFERLETTER',
          NUMBER: newNumber
        }).subscribe({
          next: () => {
            // Build post model combining all parameters
            const postModel = {
              CUSTCODE: email,
              CUSTNAME: name,
              RENT: rent,
              PROPNAME: this.model.buildname?.trim() || '',
              BUILDNUMBER: [this.model.plotno, this.model.buildname]
                .filter(v => v && v.trim() !== '')
                .map(v => v.trim())
                .join(' '),
              BUILNAME: this.model.area?.trim() || '',
              UNITID: this.model.unitIdHidden?.trim() || '',
              FLATNO: this.model.unitnr?.trim() || '',
              UNITNR: this.model.unitnr?.trim() || '',
              REGNO: this.model.makani?.trim() || '',
              FLOORNO: this.model.floor?.trim() || '',
              NOBED: this.model.nobed?.trim() || '0',
              VALID: valid,
              REFNO: generatedRefNo
            };

            // 3. Generate PDF Blob
            this.offerLetterService.generateContractDetails(postModel).subscribe({
              next: (blobData) => {
                this.isGenerating = false;
                this.cdr.detectChanges();
                const blob = new Blob([blobData], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
              },
              error: (err) => {
                this.isGenerating = false;
                this.cdr.detectChanges();
                console.error('Failed to generate PDF:', err);
                alert('PDF generation failed. Please try again.');
              }
            });
          },
          error: (err) => {
            this.isGenerating = false;
            this.cdr.detectChanges();
            console.error('Failed to reserve reference number:', err);
            alert('Failed to reserve Ref No. Please try again.');
          }
        });
      },
      error: (err) => {
        this.isGenerating = false;
        this.cdr.detectChanges();
        console.error('Failed to retrieve document sequence:', err);
        alert('Failed to generate Reference number. Please try again.');
      }
    });
  }

  resetForm(): void {
    window.location.reload();
  }
}
