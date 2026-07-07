import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';

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
export class UsersComponent implements OnInit {

  // ============================================
  // USER MODEL
  // ============================================
  user = {
    userId: '',
    password: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    branch: '',
    email: '',
    gender: 'Male',
    city: '',
    country: 'UAE',
    status: 'Active',
    securityGroup: ''
  };

  // State Management
  usersList: any[] = [];
  filteredUsers: any[] = [];
  searchText = '';
  isEditMode = false;
  editingUserId: number | null = null;
  statusMessage = '';
  isSaving = false;
  debugError = ''; // Diagnostic visual helper

  // ============================================
  // DROPDOWNS
  // ============================================
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
  constructor(
    private userService: UserService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  // ============================================
  // FETCH ALL USERS
  // ============================================
  loadAllUsers(): void {
    this.userService.getAll().subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          try {
            const dbList = response?.data || response || [];
            this.usersList = dbList.map((item: any) => ({
              id: item.id,
              userName: item.userName || '',
              fullName: item.fullName || '',
              email: item.email || '',
              contactNumber: item.contactNumber || '',
              branch: item.branch || '',
              gender: item.gender || '',
              city: item.city || '',
              country: item.country || 'UAE',
              isActive: item.isActive ?? true,
              firstName: item.firstName || '',
              lastName: item.lastName || '',
              securityGroup: item.groups?.[0]?.securityGroup?.groupName || ''
            }));
            this.filteredUsers = [...this.usersList];
            this.cdr.detectChanges();
          } catch (ex: any) {
            console.error('Exception mapping loaded users:', ex);
            this.debugError = 'Load mapping error: ' + ex.message;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error('Failed to load users:', err);
          this.debugError = 'Load API error: ' + (err.message || JSON.stringify(err));
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ============================================
  // SAVE USER
  // ============================================
  onSave(form: NgForm): void {
    if (form.invalid) {
      alert('Please fill all required fields.');
      return;
    }

    if (this.isSaving) return;

    this.debugError = ''; // Clear previous errors

    // Build C# matching API payload
    const payload: User = {
      userName: this.user.userId,
      fullName: `${this.user.firstName} ${this.user.lastName}`.trim(),
      email: this.user.email,
      password: this.user.password || undefined,
      isActive: this.user.status === 'Active',
      securityGroupIds: []
    };

    // Add UI specific optional mapping properties matching backend response schema
    const extendedPayload = {
      ...payload,
      contactNumber: this.user.contactNumber || null,
      branch: this.user.branch || null,
      gender: this.user.gender || null,
      country: this.user.country || 'UAE',
      city: this.user.city || null,
      firstName: this.user.firstName || null,
      lastName: this.user.lastName || null
    };

    this.isSaving = true;
    this.statusMessage = this.isEditMode ? 'Saving changes...' : 'Adding user...';
    this.cdr.detectChanges();

    if (this.isEditMode && this.editingUserId !== null) {
      this.userService.update(this.editingUserId, extendedPayload as any).subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            try {
              console.log('Update user success response:', response);
              this.statusMessage = 'Changes saved successfully.';
              setTimeout(() => {
                this.ngZone.run(() => {
                  this.statusMessage = '';
                  this.cdr.detectChanges();
                });
              }, 4000);

              // Optimistic local update
              this.usersList = this.usersList.map(u => {
                if (u.id === this.editingUserId) {
                  return {
                    ...u,
                    userName: this.user.userId,
                    fullName: `${this.user.firstName} ${this.user.lastName}`.trim(),
                    email: this.user.email,
                    contactNumber: this.user.contactNumber,
                    branch: this.user.branch,
                    gender: this.user.gender,
                    city: this.user.city,
                    country: this.user.country,
                    isActive: this.user.status === 'Active',
                    firstName: this.user.firstName,
                    lastName: this.user.lastName
                  };
                }
                return u;
              });
              this.filteredUsers = [...this.usersList];

              this.resetForm();
              this.isSaving = false;
              this.isEditMode = false;
              this.editingUserId = null;
              this.cdr.detectChanges();

              // Silent background reload
              this.loadAllUsers();
            } catch (ex: any) {
              console.error('Exception inside user update callback:', ex);
              this.debugError = 'Update callback error: ' + ex.message;
              this.isSaving = false;
              this.isEditMode = false;
              this.editingUserId = null;
              this.statusMessage = 'Error mapping update.';
              this.cdr.detectChanges();
            }
          });
        },
        error: (err: any) => {
          this.ngZone.run(() => {
            console.error('Failed to update user:', err);
            this.isSaving = false;
            this.statusMessage = '';
            this.debugError = 'Update API error: ' + (err.message || JSON.stringify(err));
            this.cdr.detectChanges();
            alert(err.error?.message || err.message || 'Failed to update user.');
          });
        }
      });
    } else {
      this.userService.create(extendedPayload as any).subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            try {
              console.log('Create user success response:', response);
              // Set success message exactly as requested
              this.statusMessage = 'User Added Successfully';
              setTimeout(() => {
                this.ngZone.run(() => {
                  this.statusMessage = '';
                  this.cdr.detectChanges();
                });
              }, 4000);

              // Optimistic local append
              const createdUser = response?.data || response;
              const newRow = {
                id: createdUser?.id || Date.now(),
                userName: this.user.userId,
                fullName: `${this.user.firstName} ${this.user.lastName}`.trim(),
                email: this.user.email,
                contactNumber: this.user.contactNumber,
                branch: this.user.branch,
                gender: this.user.gender,
                city: this.user.city,
                country: this.user.country,
                isActive: this.user.status === 'Active',
                firstName: this.user.firstName,
                lastName: this.user.lastName
              };
              this.usersList = [...this.usersList, newRow];
              this.filteredUsers = [...this.usersList];

              this.resetForm();
              this.isSaving = false;
              this.cdr.detectChanges();

              // Silent background reload
              this.loadAllUsers();
            } catch (ex: any) {
              console.error('Exception inside user create callback:', ex);
              this.debugError = 'Create callback error: ' + ex.message;
              this.isSaving = false;
              this.resetForm();
              this.statusMessage = 'Error mapping new user.';
              this.cdr.detectChanges();
            }
          });
        },
        error: (err: any) => {
          this.ngZone.run(() => {
            console.error('Failed to create user:', err);
            this.isSaving = false;
            this.statusMessage = '';
            this.debugError = 'Create API error: ' + (err.message || JSON.stringify(err));
            this.cdr.detectChanges();
            alert(err.error?.message || err.message || 'Failed to create user.');
          });
        }
      });
    }
  }

  // ============================================
  // EDIT USER
  // ============================================
  editUser(row: any): void {
    this.isEditMode = true;
    this.editingUserId = row.id;

    this.user = {
      userId: row.userName,
      password: '', // Kept empty for security during editing unless reset
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      contactNumber: row.contactNumber || '',
      branch: row.branch || '',
      email: row.email || '',
      gender: row.gender || 'Male',
      city: row.city || '',
      country: row.country || 'UAE',
      status: row.isActive ? 'Active' : 'Inactive',
      securityGroup: row.securityGroup || ''
    };
    this.cdr.detectChanges();
  }



  onSearch(): void {
    console.log('Search Email clicked');
  }

  toggleStatus(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.user.status = checked ? 'Active' : 'Inactive';
    this.cdr.detectChanges();
  }

  filterUsers(): void {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      this.filteredUsers = [...this.usersList];
      this.cdr.detectChanges();
      return;
    }
    this.filteredUsers = this.usersList.filter(u =>
      u.userName.toLowerCase().includes(search) ||
      u.fullName.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
    this.cdr.detectChanges();
  }

  // ============================================
  // RESET
  // ============================================
  resetForm(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.user = {
      userId: '',
      password: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      branch: '',
      email: '',
      gender: 'Male',
      city: '',
      country: 'UAE',
      status: 'Active',
      securityGroup: ''
    };
    this.cdr.detectChanges();
  }
}