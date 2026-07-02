import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent {

  // ===========================================
  // MODEL
  // ===========================================

  department = {
    departmentId: '',
    departmentName: ''
  };

  // ===========================================
  // CONSTRUCTOR
  // ===========================================

  constructor() {}

  // ===========================================
  // SAVE
  // ===========================================

  onSave(form: NgForm): void {

    if (form.invalid) {

      alert('Please enter all required fields.');
      return;

    }

    console.log('Department Saved');

    console.log(this.department);

    alert('Department added successfully.');

  }

  // ===========================================
  // SEARCH
  // ===========================================

  searchDepartment(): void {

    console.log('Search Department');

    // Replace with search popup later

    this.department = {
      departmentId: 'DEP001',
      departmentName: 'Accounts'
    };

  }

  // ===========================================
  // DELETE
  // ===========================================

  deleteDepartment(): void {

    if (confirm('Delete this department?')) {

      console.log('Department Deleted');

      this.resetForm();

    }

  }

  // ===========================================
  // REFRESH
  // ===========================================

  refreshForm(): void {

    this.resetForm();

  }

  // ===========================================
  // RESET
  // ===========================================

  resetForm(): void {

    this.department = {

      departmentId: '',
      departmentName: ''

    };

  }

}