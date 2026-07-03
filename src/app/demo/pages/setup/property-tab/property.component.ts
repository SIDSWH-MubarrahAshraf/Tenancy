import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class PropertyComponent {
  @Input() inactive = false;
  @Output() inactiveChange = new EventEmitter<boolean>();
  @Input() propertyId = '';
  @Output() propertyIdChange = new EventEmitter<string>();

  constructor(
    private propertyService: PropertyService
  ) { }
  
  propertyKey: number = 0;

  // Custom dropdown states
  showTypeDropdown = false;
  showCountryDropdown = false;
  showDeleteConfirmModal = false;
  statusMessage = '';

  // Search popup attributes
  showSearchPopup = false;
  loadingProperties = false;
  dbProperties: any[] = [];

  onPropertyIdChange(val: string): void {
    this.propertyId = val;
    this.propertyIdChange.emit(val);
  }

  toggleTypeDropdown(): void {
    this.showTypeDropdown = !this.showTypeDropdown;
    this.showCountryDropdown = false;
    this.showSearchPopup = false;
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown = !this.showCountryDropdown;
    this.showTypeDropdown = false;
    this.showSearchPopup = false;
  }

  selectPropertyType(val: string): void {
    this.propertyType = val;
    this.showTypeDropdown = false;
  }

  selectPropertyCountry(val: string): void {
    this.propertyCountry = val;
    this.showCountryDropdown = false;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
  }

  confirmDelete(): void {
    this.showDeleteConfirmModal = false;
    this.propertyService.deleteProperty(this.propertyKey).subscribe({
      next: (response) => {
        this.clearPropertyForm();
      },
      error: (err) => {
        console.error('Failed to delete property:', err);
        alert('Failed to delete property: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleSearchPopup(): void {
    this.showSearchPopup = !this.showSearchPopup;
    if (this.showSearchPopup) {
      this.showTypeDropdown = false;
      this.showCountryDropdown = false;
      this.loadDbProperties();
    }
  }

  loadDbProperties(): void {
    this.loadingProperties = true;
    this.propertyService.getProperties().subscribe({
      next: (response) => {
        this.loadingProperties = false;
        console.log('Database properties response:', response);
        if (response && response.data) {
          this.dbProperties = response.data;
        } else if (Array.isArray(response)) {
          this.dbProperties = response;
        } else {
          this.dbProperties = [];
        }
      },
      error: (err) => {
        this.loadingProperties = false;
        console.error('Failed to load database properties', err);
        alert('Failed to load properties list from database.');
      }
    });
  }

  selectPropertyFromDb(prop: any): void {
    this.showSearchPopup = false;
    this.propertyKey = prop.id || 0;
    this.propertyId = prop.propertyId || '';
    this.propertyName = prop.propertyName || '';
    this.propertyArea = prop.propertyArea || '';
    this.propertyMakani = prop.propertyMakani || '';
    this.propertyCountry = prop.propertyCountry || '';
    this.propertyCity = prop.propertyCity || '';
    this.propertyType = prop.propertyType || '';
    this.plotNo = prop.plotNo || '';
    this.landDmNumber = prop.landDmNumber || '';
    this.others = prop.others || '';
    this.inactive = prop.inactive || false;
    this.inactiveChange.emit(this.inactive);
    this.propertyIdChange.emit(this.propertyId);
    this.remarks = prop.remarks || '';

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
      alert('Property ID is required.');
      return;
    }

    if (!this.propertyName || !this.propertyName.trim()) {
      alert('Property Name is required.');
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
        } else {
          alert(response?.message || 'Failed to save property.');
        }
      },
      error: (error) => {
        console.error('Detailed error saving property:', error);
        const errorMsg = error.error?.message || error.message || 'Internal Server Error';
        alert(`Error saving property: ${errorMsg}`);
      }
    });
  }

  saveChanges(): void {
    if (!this.propertyKey) {
      alert('No property is currently loaded to update. Please select a property first.');
      return;
    }

    if (!this.propertyId || !this.propertyId.trim()) {
      alert('Property ID is required.');
      return;
    }

    if (!this.propertyName || !this.propertyName.trim()) {
      alert('Property Name is required.');
      return;
    }

    const property = this.cleanPropertyPayload();

    this.propertyService.updateProperty(this.propertyKey, property).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.propertyIdChange.emit(this.propertyId);
          this.statusMessage = 'Changes saved successfully.';
          setTimeout(() => this.statusMessage = '', 4000);
        } else {
          alert(response?.message || 'Failed to save changes.');
        }
      },
      error: (error) => {
        console.error('Detailed error updating property:', error);
        const errorMsg = error.error?.message || error.message || 'Internal Server Error';
        alert(`Error saving changes: ${errorMsg}`);
      }
    });
  }

  deleteProperty(): void {
    if (!this.propertyKey) {
      alert('No property is currently loaded or saved to delete.');
      return;
    }
    this.showDeleteConfirmModal = true;
  }

  clearPropertyForm(): void {
    this.propertyId = '';
    this.propertyKey = 0;
    this.propertyIdChange.emit('');
    this.propertyName = '';
    this.propertyArea = '';
    this.propertyMakani = '';
    this.propertyCountry = '';
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