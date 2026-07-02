import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-email-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './email-setup.component.html',
  styleUrls: ['./email-setup.component.scss']
})
export class EmailSetupComponent {

  // ==========================================
  // MODEL
  // ==========================================

  email = {

    emailHost: '',
    emailPort: 587,

    emailUser: '',
    emailPassword: '',

    emailFromAddress: '',
    emailCcAddress: '',

    testEmail: ''

  };

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {}

  // ==========================================
  // ADD
  // ==========================================

  saveEmailSetup(form: NgForm): void {

    if (form.invalid) {

      alert('Please fill all required fields.');
      return;

    }

    console.log('Email Configuration');

    console.table(this.email);

    alert('Email configuration saved successfully.');

  }

  // ==========================================
  // UPDATE
  // ==========================================

  updateEmailSetup(): void {

    console.log('Update Email Configuration');

    console.table(this.email);

    alert('Email configuration updated successfully.');

  }

  // ==========================================
  // TEST EMAIL
  // ==========================================

  sendTestEmail(): void {

    if (!this.email.testEmail) {

      alert('Please enter a Test Email Address.');
      return;

    }

    console.log('Sending Test Email');

    console.log(this.email.testEmail);

    // Replace this with API integration later

    alert('Test Email sent successfully.');

  }

  // ==========================================
  // RESET
  // ==========================================

  resetForm(): void {

    this.email = {

      emailHost: '',
      emailPort: 587,

      emailUser: '',
      emailPassword: '',

      emailFromAddress: '',
      emailCcAddress: '',

      testEmail: ''

    };

  }

}