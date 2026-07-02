import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {

  // ============================================
  // USER MODEL
  // ============================================

  user = {

    userId: '',
    password: '',
    firstName: '',
    lastName: '',
    contactNumber: '',

    department: '',
    departmentId: '',

    designation: '',
    branch: '',

    email: '',

    gender: 'Male',

    city: '',
    country: '',

    status: 'Active',
  securityGroup: '',


  };

  // ============================================
  // DROPDOWNS
  // ============================================

  designations: string[] = [

    'Manager',
    'Assistant Manager',
    'Supervisor',
    'Accountant',
    'Sales Executive',
    'Operator'

  ];

  branches: string[] = [

    'Head Office',
    'Lahore',
    'Karachi',
    'Islamabad',
    'Faisalabad'

  ];

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor() {}

  // ============================================
  // SAVE USER
  // ============================================

  onSave(form: NgForm): void {

    if (form.invalid) {

      alert('Please fill all required fields.');

      return;

    }

    console.log('User Data');

    console.log(this.user);

    alert('User saved successfully.');

  }

  // ============================================
  // DELETE USER
  // ============================================

  deleteUser(): void {

    if (confirm('Delete this user?')) {

      console.log('Delete User');

      this.resetForm();

    }

  }

  // ============================================
  // SEARCH DEPARTMENT
  // ============================================

  searchDepartment(): void {

    // This will be replaced with Department Popup

    console.log('Search Department');

    // Dummy value

    this.user.department = 'Accounts';

  }
onSearch(): void {
  console.log('Search Email clicked');
}
toggleStatus(event: Event): void {

  const checked = (event.target as HTMLInputElement).checked;

  this.user.status = checked ? 'Active' : 'Inactive';

}
  // ============================================
  // RESET
  // ============================================

  resetForm(): void {

    this.user = {

      userId: '',
      password: '',
      firstName: '',
      lastName: '',

      contactNumber: '',

      department: '',
      departmentId: '',

      designation: '',
      branch: '',

      email: '',

      gender: 'Male',

      city: '',
      country: '',

      status: 'Active',

      securityGroup: ''

    };

  }

}