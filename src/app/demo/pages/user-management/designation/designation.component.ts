import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss']
})
export class DesignationComponent {

  // ==========================================
  // MODEL
  // ==========================================

  designation = {

    departmentId: '',
    departmentName: '',

    designationId: '',
    designationName: ''

  };

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() { }

  // ==========================================
  // SAVE
  // ==========================================

  onSave(form: NgForm): void {

    if (form.invalid) {

      alert('Please fill all required fields.');
      return;

    }

    console.log('Designation Saved');

    console.table(this.designation);

    alert('Designation saved successfully.');

  }

  // ==========================================
  // SEARCH DEPARTMENT
  // ==========================================

  searchDepartment(): void {

    console.log('Search Department');

    // Replace with popup search

    this.designation.departmentId = 'DEP001';
    this.designation.departmentName = 'Accounts';

  }

  // ==========================================
  // SEARCH DESIGNATION
  // ==========================================

  searchDesignation(): void {

    console.log('Search Designation');

    // Replace with API Search

    this.designation.designationId = 'DES001';
    this.designation.designationName = 'Senior Accountant';

  }

  // ==========================================
  // DELETE
  // ==========================================

  deleteDesignation(): void {

    const confirmation = confirm(
      'Are you sure you want to delete this designation?'
    );

    if (!confirmation) {
      return;
    }

    console.log('Designation Deleted');

    this.resetForm();

  }

  // ==========================================
  // REFRESH
  // ==========================================

  refreshForm(): void {

    this.resetForm();

  }

  // ==========================================
  // RESET
  // ==========================================

  resetForm(): void {

    this.designation = {

      departmentId: '',
      departmentName: '',

      designationId: '',
      designationName: ''

    };

  }

}