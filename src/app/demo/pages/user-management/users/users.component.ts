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
    email: '',
    gender: 'Male',
    city: 'Dubai',
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
  showCityDropdown = false;
  showThemeDropdown = false;
  securityGroups: string[] = ['Admin', 'Warehouse', 'Office', 'Branch'];
  genders: string[] = ['Male', 'Female', 'Custom'];
  themes: string[] = ['Purple', 'Green', 'Blue', 'Orange'];
  cities: string[] = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

  // ============================================
  // DROPDOWNS
  // ============================================

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
      branch: null,
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
      // Validate user status in the database first
      this.userService.getById(this.editingUserId).subscribe({
        next: (response: any) => {
          const dbUser = response?.data || response;
          if (dbUser && dbUser.isActive === false) {
            this.isSaving = false;
            this.statusMessage = '';
            this.showAlert('error', 'Validation Failed', `Cannot modify user. The user "${dbUser.userName || this.user.userId}" is inactive.`);
            
            // Revert state
            this.resetForm();
            this.isEditMode = false;
            this.editingUserId = null;
            this.loadAllUsers();
            this.cdr.detectChanges();
            return;
          }

          this.proceedToUpdateUser(extendedPayload);
        },
        error: (err) => {
          console.warn('User status validation failed, proceeding with update', err);
          this.proceedToUpdateUser(extendedPayload);
        }
      });
    } else {
      this.proceedToAddUser(extendedPayload);
    }
  }

  private proceedToUpdateUser(extendedPayload: any): void {
    this.userService.update(this.editingUserId!, extendedPayload as any).subscribe({
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
                  branch: '',
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
  }

  private proceedToAddUser(extendedPayload: any): void {
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
              branch: '',
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

  // ============================================
  // EDIT USER
  // ============================================
  editUser(row: any): void {
    this.isEditMode = true;
    this.editingUserId = row.id;
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showCityDropdown = false;
    this.showThemeDropdown = false;

    this.user = {
      userId: row.userName,
      password: '', // Kept empty for security during editing unless reset
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      contactNumber: row.contactNumber || '',
      email: row.email || '',
      gender: row.gender || 'Male',
      city: row.city || 'Dubai',
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
    this.showCityDropdown = false;
    this.showThemeDropdown = false;
    this.user = {
      userId: '',
      password: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      email: '',
      gender: 'Male',
      city: 'Dubai',
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
    this.showCityDropdown = false;
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
    this.showCityDropdown = false;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  selectGender(gender: string): void {
    this.user.gender = gender;
    this.showGenderDropdown = false;
    this.cdr.detectChanges();
  }

  toggleCityDropdown(): void {
    if (this.isSaving) return;
    this.showCityDropdown = !this.showCityDropdown;
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showThemeDropdown = false;
    this.cdr.detectChanges();
  }

  selectCity(city: string): void {
    this.user.city = city;
    this.showCityDropdown = false;
    this.cdr.detectChanges();
  }

  toggleThemeDropdown(): void {
    if (this.isSaving) return;
    this.showThemeDropdown = !this.showThemeDropdown;
    this.showSecurityGroupDropdown = false;
    this.showGenderDropdown = false;
    this.showCityDropdown = false;
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
      this.showCityDropdown = false;
      this.showThemeDropdown = false;
      this.cdr.detectChanges();
    }
  }

  // ============================================
  // USER SEARCH MODAL POPUP HELPERS
  // ============================================
  showSearchPopup = false;
  searchPopupQuery = '';
  filteredPopupUsers: any[] = [];

  openSearchPopup(): void {
    this.showSearchPopup = true;
    this.searchPopupQuery = '';
    this.filteredPopupUsers = [...this.usersList];
    this.cdr.detectChanges();
  }

  closeSearchPopup(): void {
    this.showSearchPopup = false;
    this.cdr.detectChanges();
  }

  filterPopupUsers(): void {
    const q = (this.searchPopupQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredPopupUsers = [...this.usersList];
    } else {
      this.filteredPopupUsers = this.usersList.filter(u =>
        String(u.userName || '').toLowerCase().includes(q) ||
        String(u.fullName || '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  selectUserFromPopup(row: any): void {
    this.editUser(row);
    this.showSearchPopup = false;
    this.cdr.detectChanges();
  }
}