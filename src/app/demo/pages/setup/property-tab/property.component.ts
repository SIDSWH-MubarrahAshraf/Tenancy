import { Component, Input, Output, EventEmitter, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { PropertyService } from 'src/app/services/property.service';

@Component({
  selector: 'app-property',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './property.component.html',
  styleUrls: ['./property.component.scss']
})
export class PropertyComponent implements OnInit {
  @Input() inactive = false;
  @Output() inactiveChange = new EventEmitter<boolean>();
  @Input() propertyId = '';
  @Output() propertyIdChange = new EventEmitter<string>();

  constructor(
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    if (!this.propertyCountry) {
      this.propertyCountry = 'UAE';
    }
    if (!this.propertyId) {
      this.generateNewPropertyId();
    }
  }

  generateNewPropertyId(): void {
    this.propertyService.getProperties().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        }
        
        let maxNum = 0;
        list.forEach(p => {
          const match = String(p.propertyId || '').match(/PROP-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        const nextNum = maxNum + 1;
        const paddedNum = String(nextNum).padStart(3, '0');
        this.propertyId = `PROP-${paddedNum}`;
        this.propertyIdChange.emit(this.propertyId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const rand = Math.floor(100 + Math.random() * 900);
        this.propertyId = `PROP-${rand}`;
        this.propertyIdChange.emit(this.propertyId);
        this.cdr.detectChanges();
      }
    });
  }

  propertyKey: number = 0;

  // Custom dropdown states
  showTypeDropdown = false;
  showCountryDropdown = false;
  showCityDropdown = false;
  showDeleteConfirmModal = false;
  statusMessage = '';

  // Search popup attributes
  showSearchPopup = false;
  showPropertySearchPopup = false;
  searchQuery = '';
  loadingProperties = false;
  dbProperties: any[] = [];
  allProperties: any[] = [];
  filteredProperties: any[] = [];

  onPropertyIdChange(val: string): void {
    this.propertyId = val;
    this.propertyIdChange.emit(val);
  }

  toggleTypeDropdown(): void {
    this.showTypeDropdown = !this.showTypeDropdown;
    this.showCountryDropdown = false;
    this.showCityDropdown = false;
    this.showSearchPopup = false;
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown = !this.showCountryDropdown;
    this.showTypeDropdown = false;
    this.showCityDropdown = false;
    this.showSearchPopup = false;
  }

  toggleCityDropdown(): void {
    this.showCityDropdown = !this.showCityDropdown;
    this.showTypeDropdown = false;
    this.showCountryDropdown = false;
    this.showSearchPopup = false;
  }

  selectPropertyType(type: string): void {
    this.propertyType = type;
    this.showTypeDropdown = false;
  }

  selectPropertyCountry(country: string): void {
    this.propertyCountry = country;
    this.showCountryDropdown = false;
  }

  selectPropertyCity(city: string): void {
    this.propertyCity = city;
    this.showCityDropdown = false;
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

  searchProperty(): void {
    if (!this.propertyId || !this.propertyId.trim()) {
      this.showAlert('warning', 'Input Required', 'Please enter a Property ID to search.');
      return;
    }

    const searchId = this.propertyId.trim().toLowerCase();
    this.loadingProperties = true;
    this.cdr.detectChanges();

    this.propertyService.getProperties().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.loadingProperties = false;
          let list: any[] = [];
          if (response && response.data) {
            list = response.data;
          } else if (Array.isArray(response)) {
            list = response;
          } else if (response) {
            list = [response];
          }

          const match = list.find(p => String(p.propertyId || '').trim().toLowerCase() === searchId);

          if (match) {
            this.selectPropertyFromDb(match);
          } else {
            this.showAlert('error', 'Not Found', `Property ID "${this.propertyId}" was not found in the database.`);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.loadingProperties = false;
          console.error('Failed to search property:', err);
          this.showAlert('error', 'Search Error', 'Failed to retrieve property data. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  openSearchModal(): void {
    this.showPropertySearchPopup = true;
    this.loadingProperties = true;
    this.allProperties = [];
    this.filteredProperties = [];
    this.searchQuery = '';

    this.propertyService.getProperties().subscribe({
      next: (response) => {
        let list: any[] = [];
        if (response && response.data) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        }
        this.allProperties = list;
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
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredProperties = [...this.allProperties];
    } else {
      this.filteredProperties = this.allProperties.filter(p =>
        String(p.propertyId || '').toLowerCase().includes(q) ||
        String(p.propertyName || '').toLowerCase().includes(q) ||
        String(p.propertyType || '').toLowerCase().includes(q) ||
        String(p.propertyCity || '').toLowerCase().includes(q)
      );
    }
  }

  selectProperty(p: any): void {
    this.selectPropertyFromDb(p);
    this.showPropertySearchPopup = false;
  }

  selectPropertyFromDb(prop: any): void {
    this.showSearchPopup = false;
    this.propertyKey = prop.id || 0;
    this.propertyId = prop.propertyId || '';
    this.propertyName = prop.propertyName || '';
    this.propertyArea = prop.propertyArea || '';
    this.propertyMakani = prop.propertyMakani || '';
    this.propertyCountry = prop.propertyCountry || 'UAE';
    this.propertyCity = prop.propertyCity || '';
    this.propertyType = prop.propertyType || '';
    this.plotNo = prop.plotNo || '';
    this.landDmNumber = prop.landDmNumber || '';
    this.others = prop.others || '';
    this.inactive = prop.inactive || false;
    this.inactiveChange.emit(this.inactive);
    this.propertyIdChange.emit(this.propertyId);
    this.remarks = prop.remarks || '';
    this.cdr.detectChanges();

    // Load attachments if any
    if (prop.attachments && Array.isArray(prop.attachments)) {
      this.documents = prop.attachments.map((att: any) => ({
        id: att.id,
        name: att.fileName || att.name || 'Attachment',
        uploadDate: att.uploadDate ? new Date(att.uploadDate).toLocaleDateString() : new Date().toLocaleDateString()
      }));
    } else {
      this.documents = [];
    }
  }

  // =========================
  // Property Fields
  // =========================
  propertyName = '';
  propertyArea = '';
  propertyMakani = '';
  propertyCountry = '';
  propertyCity = '';
  propertyType = '';
  plotNo = '';
  landDmNumber = '';
  others = '';
  remarks = '';

  // =========================
  // Document Fields
  // =========================
  selectedFile: File | null = null;

  documents: any[] = [];

  // =========================
  // Property Methods
  // =========================
  private cleanPropertyPayload(): any {
    const property: any = {
      propertyId: this.propertyId ? this.propertyId.trim() : '',
      propertyName: this.propertyName ? this.propertyName.trim() : ''
    };

    const addOptionalString = (key: string, val: string) => {
      if (val && val.trim()) {
        property[key] = val.trim();
      } else {
        property[key] = null;
      }
    };

    addOptionalString('propertyArea', this.propertyArea);
    addOptionalString('propertyMakani', this.propertyMakani);
    addOptionalString('propertyCountry', this.propertyCountry);
    addOptionalString('propertyCity', this.propertyCity);
    addOptionalString('propertyType', this.propertyType);
    addOptionalString('plotNo', this.plotNo);
    addOptionalString('landDmNumber', this.landDmNumber);
    addOptionalString('others', this.others);
    addOptionalString('remarks', this.remarks);

    property.inactive = !!this.inactive;
    property.inactiveDate = property.inactive ? new Date() : null;

    return property;
  }

  saveProperty(): void {
    if (!this.propertyId || !this.propertyId.trim()) {
      this.showAlert('warning', 'Input Required', 'Property ID is required.');
      return;
    }

    if (!this.propertyName || !this.propertyName.trim()) {
      this.showAlert('warning', 'Input Required', 'Property Name is required.');
      return;
    }

    const property = this.cleanPropertyPayload();

    this.propertyService.saveProperty(property).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.propertyKey = response.data.id;
          this.propertyIdChange.emit(this.propertyId);
          this.statusMessage = 'Property saved successfully.';
          setTimeout(() => this.statusMessage = '', 4000);
          this.showAlert('success', 'Created Successfully', 'Property has been created successfully.');
        } else {
          this.showAlert('error', 'Save Failed', response?.message || 'Failed to save property.');
        }
      },
      error: (error) => {
        console.error('Detailed error saving property:', error);
        const errorMsg = error.error?.message || error.message || 'Internal Server Error';
        this.showAlert('error', 'Save Error', errorMsg);
      }
    });
  }

  saveChanges(): void {
    if (!this.propertyKey) {
      this.showAlert('warning', 'Selection Required', 'No property is currently loaded to update. Please select a property first.');
      return;
    }

    if (!this.propertyId || !this.propertyId.trim()) {
      this.showAlert('warning', 'Input Required', 'Property ID is required.');
      return;
    }

    if (!this.propertyName || !this.propertyName.trim()) {
      this.showAlert('warning', 'Input Required', 'Property Name is required.');
      return;
    }

    const property = this.cleanPropertyPayload();

    this.propertyService.updateProperty(this.propertyKey, property).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.propertyIdChange.emit(this.propertyId);
          this.statusMessage = 'Changes saved successfully.';
          setTimeout(() => this.statusMessage = '', 4000);
          this.showAlert('success', 'Updated Successfully', 'Property details have been updated.');
        } else {
          this.showAlert('error', 'Update Failed', response?.message || 'Failed to save changes.');
        }
      },
      error: (error) => {
        console.error('Detailed error updating property:', error);
        const errorMsg = error.error?.message || error.message || 'Internal Server Error';
        this.showAlert('error', 'Update Error', errorMsg);
      }
    });
  }

  deleteProperty(): void {
    if (!this.propertyKey) {
      this.showAlert('warning', 'Selection Required', 'No property is currently loaded or saved to delete.');
      return;
    }

    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to delete property "${this.propertyId}"?`,
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
    this.propertyService.deleteProperty(this.propertyKey).subscribe({
      next: (response) => {
        this.clearPropertyForm();
        this.showAlert('success', 'Deleted Successfully', 'Property has been deleted.');
      },
      error: (err) => {
        console.error('Failed to delete property:', err);
        this.showAlert('error', 'Delete Failed', err.error?.message || err.message || 'Failed to delete property.');
      }
    });
  }

  clearPropertyForm(): void {
    this.propertyId = '';
    this.propertyKey = 0;
    this.propertyIdChange.emit('');
    this.propertyName = '';
    this.propertyArea = '';
    this.propertyMakani = '';
    this.propertyCountry = 'UAE';
    this.propertyCity = '';
    this.propertyType = '';
    this.plotNo = '';
    this.landDmNumber = '';
    this.others = '';
    this.remarks = '';
    this.inactive = false;
    this.inactiveChange.emit(this.inactive);

    // Clear uploaded documents as well
    this.selectedFile = null;
    this.documents = [];

    // Automatically generate next Property ID
    this.generateNewPropertyId();
  }

  // =========================
  // Document Methods
  // =========================

 onFileSelected(event: any): void {
  if (event.target.files && event.target.files.length > 0) {
    this.selectedFile = event.target.files[0];

    // Automatically add the document
    this.saveDocument();

    // Optional: allow selecting the same file again later
    event.target.value = '';
  }
}

  saveDocument(): void {
    if (!this.selectedFile) {
      alert('Please choose a document first.');
      return;
    }

    if (!this.propertyKey) {
      alert('Please save the property details first before uploading documents.');
      this.selectedFile = null;
      return;
    }

    const remarks = prompt('Enter remarks for this document (optional):') || '';

    this.propertyService.uploadAttachment(this.propertyKey, this.selectedFile, remarks).subscribe({
      next: (response) => {
        const newDocument = {
          id: response?.data?.id || 0,
          name: response?.data?.fileName || this.selectedFile!.name,
          uploadDate: new Date().toLocaleDateString(),
          file: this.selectedFile
        };
        this.documents.unshift(newDocument);
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Failed to upload document:', err);
        alert('Failed to upload document: ' + (err.error?.message || err.message));
      }
    });
  }

  viewDocument(doc: any): void {

    if (!doc.file) {
      return;
    }

    const url = URL.createObjectURL(doc.file);

    window.open(url, '_blank');

    URL.revokeObjectURL(url);
  }

  downloadDocument(doc: any): void {

    if (!doc.file) {
      return;
    }

    const url = URL.createObjectURL(doc.file);

    const a = document.createElement('a');

    a.href = url;
    a.download = doc.file.name;

    a.click();

    URL.revokeObjectURL(url);
  }

}