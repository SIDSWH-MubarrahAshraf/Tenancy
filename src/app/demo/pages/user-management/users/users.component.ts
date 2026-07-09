import { Component, OnInit, NgZone, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
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
    securityGroup: '',
    selectedTheme: 'Purple'
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
  showSecurityGroupDropdown = false;
  showGenderDropdown = false;
  showBranchDropdown = false;
  showThemeDropdown = false;
  securityGroups: string[] = ['Admin', 'Warehouse', 'Office', 'Branch'];
  genders: string[] = ['Male', 'Female', 'Custom'];
  themes: string[] = ['Purple', 'Green', 'Blue', 'Orange'];

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
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

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
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields.');
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
      securityGroupIds: [],
      selectedTheme: this.user.selectedTheme || 'Purple'
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
                    lastName: this.user.lastName,
                    selectedTheme: this.user.selectedTheme
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
              this.showAlert('success', 'Updated Successfully', 'User details have been updated.');

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
            this.showAlert('error', 'Update Failed', err.error?.message || err.message || 'Failed to update user.');
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
                lastName: this.user.lastName,
                selectedTheme: this.user.selectedTheme
              };
              this.usersList = [...this.usersList, newRow];
              this.filteredUsers = [...this.usersList];

              this.resetForm();
              this.isSaving = false;
              this.cdr.detectChanges();
              this.showAlert('success', 'Created Successfully', 'User has been created successfully.');

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
            this.showAlert('error', 'Create Failed', err.error?.message || err.message || 'Failed to create user.');
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
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showBranchDropdown = false;
    this.showThemeDropdown = false;

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
      securityGroup: row.securityGroup || '',
      selectedTheme: row.selectedTheme || 'Purple'
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
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showBranchDropdown = false;
    this.showThemeDropdown = false;
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
      securityGroup: '',
      selectedTheme: 'Purple'
    };
    this.cdr.detectChanges();
  }

  // ============================================
  // CUSTOM DROPDOWN HELPERS
  // ============================================
  toggleSecurityGroupDropdown(): void {
    if (this.isSaving) return;
    this.showSecurityGroupDropdown = !this.showSecurityGroupDropdown;
    this.showGenderDropdown = false;
    this.showBranchDropdown = false;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  selectSecurityGroup(group: string): void {
    this.user.securityGroup = group;
    this.showSecurityGroupDropdown = false;
    this.cdr.detectChanges();
  }

  toggleGenderDropdown(): void {
    if (this.isSaving) return;
    this.showGenderDropdown = !this.showGenderDropdown;
    this.showSecurityGroupDropdown = false;
    this.showBranchDropdown = false;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  selectGender(gender: string): void {
    this.user.gender = gender;
    this.showGenderDropdown = false;
    this.cdr.detectChanges();
  }

  toggleBranchDropdown(): void {
    if (this.isSaving) return;
    this.showBranchDropdown = !this.showBranchDropdown;
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  selectBranch(branch: string): void {
    this.user.branch = branch;
    this.showBranchDropdown = false;
    this.cdr.detectChanges();
  }

  toggleThemeDropdown(): void {
    if (this.isSaving) return;
    this.showThemeDropdown = !this.showThemeDropdown;
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showBranchDropdown = false;
    this.cdr.detectChanges();
  }

  selectTheme(theme: string): void {
    this.user.selectedTheme = theme;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  // ============================================
  // DYNAMIC STATS CALCULATORS
  // ============================================
  getActiveUsersCount(): number {
    return this.usersList.filter(u => u.isActive).length;
  }

  getInactiveUsersCount(): number {
    return this.usersList.filter(u => !u.isActive).length;
  }

  // ============================================
  // DOCUMENT CLICK HOST LISTENER
  // ============================================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-btn') && !target.closest('.custom-dropdown-popup')) {
      this.showSecurityGroupDropdown = false;
      this.showGenderDropdown = false;
      this.showBranchDropdown = false;
      this.showThemeDropdown = false;
      this.cdr.detectChanges();
    }
  }
}