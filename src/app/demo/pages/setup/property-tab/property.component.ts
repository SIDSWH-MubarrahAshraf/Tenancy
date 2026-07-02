import { Component } from '@angular/core';
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
constructor(
    private propertyService: PropertyService
  ) { }
  propertyKey: number = 0;

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
  inactive = false;

  // =========================
  // Document Fields
  // =========================
  selectedFile: File | null = null;

  documents: any[] = [];

  // =========================
  // Property Methods
  // =========================
  saveProperty(): void {

  const property = {
    propertyId: '',
    propertyName: this.propertyName,
    propertyArea: this.propertyArea,
    propertyMakani: this.propertyMakani,
    propertyCountry: this.propertyCountry,
    propertyCity: this.propertyCity,
    propertyType: this.propertyType,
    plotNo: this.plotNo,
    landDmNumber: this.landDmNumber,
    others: this.others,
    inactive: this.inactive,
    inactiveDate: null,
    remarks: this.remarks
  };
 console.log('Save button clicked');
  console.log(property);
  this.propertyService.addProperty(property).subscribe({

    next: (response) => {

      console.log(response);

      if (response.success) {

        this.propertyKey = response.data.id;

        alert('Property saved successfully.');

        console.log('Property ID:', this.propertyKey);

      } else {

        alert(response.message);

      }

    },

   error: (error) => {

  console.log('Status:', error.status);
  console.log('Headers:', error.headers);
  console.log('Error Body:', error.error);
  console.log('Complete Error:', error);

  alert(`Error ${error.status}`);

}

  });

}

  deleteProperty(): void {
    console.log('Property Deleted');
  }

  clearPropertyForm(): void {
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

    const newDocument = {
      name: this.selectedFile.name,
      uploadDate: new Date().toLocaleDateString(),
      file: this.selectedFile
    };

    this.documents.unshift(newDocument);

    this.selectedFile = null;

    alert('Document uploaded successfully.');
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