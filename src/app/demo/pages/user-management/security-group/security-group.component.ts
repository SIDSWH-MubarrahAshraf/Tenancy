import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityGroupService } from 'src/app/services/security-group.service';
import { SecurityGroup, Permission, SecurityGroupPermission } from 'src/app/models/security-group.model';

@Component({
  selector: 'app-security-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-group.component.html',
  styleUrls: ['./security-group.component.scss']
})
export class SecurityGroupComponent implements OnInit {
  private groupService = inject(SecurityGroupService);
  private cdr = inject(ChangeDetectorRef);

  // Collections
  groups: SecurityGroup[] = [];
  filteredGroups: SecurityGroup[] = [];
  
  // State variables
  isLoading = false;
  searchText = '';
  isSaving = false;

  // Group Edit Dialog Modal state
  showGroupModal = false;
  isEditMode = false;
  editingGroupId: number | null = null;
  groupForm = {
    groupCode: '',
    groupName: '',
    isActive: true
  };

  // Permission Configuration Matrix state
  showPermissionsPanel = false;
  selectedGroup: SecurityGroup | null = null;
  permissionsList: Permission[] = [];
  newModuleCode = '';

  // Predefined Modules List for dropdown selection
  availableModules = [
    'DASHBOARD',
    'PROPERTY_SETUP',
    'SERVICES',
    'USERS',
    'REMINDERS',
    'ANNOUNCEMENT'
  ];

  ngOnInit(): void {
    this.loadGroups();
    this.loadSweetAlert();
  }

  // Runtime SweetAlert injection to avoid npm dependencies
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

  // API Call: Fetch all Security Groups
  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getAll().subscribe({
      next: (res) => {
        this.groups = res.data || [];
        this.filterGroups();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load security groups', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Client-side search filtering
  filterGroups(): void {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      this.filteredGroups = [...this.groups];
    } else {
      this.filteredGroups = this.groups.filter(g =>
        String(g.groupCode || '').toLowerCase().includes(q) ||
        String(g.groupName || '').toLowerCase().includes(q)
      );
    }
  }

  // Modal actions: Add Group
  openAddModal(): void {
    this.isEditMode = false;
    this.editingGroupId = null;
    this.groupForm = {
      groupCode: '',
      groupName: '',
      isActive: true
    };
    this.showGroupModal = true;
  }

  // Modal actions: Edit Group details
  openEditModal(group: SecurityGroup): void {
    this.isEditMode = true;
    this.editingGroupId = group.id || null;
    this.groupForm = {
      groupCode: group.groupCode || '',
      groupName: group.groupName || '',
      isActive: group.isActive !== false
    };
    this.showGroupModal = true;
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
  }

  // Submit Save Group Details
  saveGroup(): void {
    if (!this.groupForm.groupCode.trim() || !this.groupForm.groupName.trim()) {
      this.loadSweetAlert().then(Swal => {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please enter Group Code and Group Name'
        });
      });
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.editingGroupId !== null) {
      // API call: Update Group details
      this.groupService.update(this.editingGroupId, this.groupForm).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.showGroupModal = false;
          this.loadGroups();
          this.loadSweetAlert().then(Swal => {
            Swal.fire({
              icon: 'success',
              title: 'Updated Successfully',
              text: 'Security Group details have been updated.'
            });
          });
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Failed to update group', err);
          this.loadSweetAlert().then(Swal => {
            Swal.fire({
              icon: 'error',
              title: 'Server Error',
              text: 'Failed to update security group.'
            });
          });
        }
      });
    } else {
      // API call: Create new Group
      this.groupService.create(this.groupForm).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.showGroupModal = false;
          this.loadGroups();
          this.loadSweetAlert().then(Swal => {
            Swal.fire({
              icon: 'success',
              title: 'Created Successfully',
              text: 'New Security Group has been registered.'
            });
          });
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Failed to create group', err);
          this.loadSweetAlert().then(Swal => {
            Swal.fire({
              icon: 'error',
              title: 'Server Error',
              text: 'Failed to create security group.'
            });
          });
        }
      });
    }
  }

  // Permissions Matrix actions: Open Configuration Panel
  configurePermissions(group: SecurityGroup): void {
    this.selectedGroup = group;
    
    // Map current permissions of the group
    // The API returns group permissions as security group permissions which embed the permission object
    const permissions: Permission[] = [];
    if (group.permissions && group.permissions.length > 0) {
      group.permissions.forEach((gp: SecurityGroupPermission) => {
        if (gp.permission) {
          permissions.push({
            id: gp.permission.id,
            moduleCode: gp.permission.moduleCode,
            canAdd: gp.permission.canAdd === true,
            canEdit: gp.permission.canEdit === true,
            canDelete: gp.permission.canDelete === true,
            canView: gp.permission.canView === true,
            canPrint: gp.permission.canPrint === true,
            canPost: gp.permission.canPost === true
          });
        }
      });
    }
    
    this.permissionsList = permissions;
    this.newModuleCode = '';
    this.showPermissionsPanel = true;
    this.cdr.detectChanges();
  }

  closePermissionsPanel(): void {
    this.showPermissionsPanel = false;
    this.selectedGroup = null;
    this.permissionsList = [];
  }

  // Add permission row for new module code
  addNewPermissionRow(): void {
    const code = this.newModuleCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    // Check duplicate
    if (this.permissionsList.some(p => p.moduleCode.toUpperCase() === code)) {
      this.loadSweetAlert().then(Swal => {
        Swal.fire({
          icon: 'warning',
          title: 'Duplicate Module',
          text: 'Permissions for this module code are already configured.'
        });
      });
      return;
    }

    this.permissionsList.push({
      moduleCode: code,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canView: true,  // default view to true
      canPrint: false,
      canPost: false
    });

    this.newModuleCode = '';
  }

  // Delete permission row from the edit matrix list
  deletePermissionRow(index: number): void {
    this.permissionsList.splice(index, 1);
  }

  // API Call: Save/Update permissions list
  savePermissionsMatrix(): void {
    if (!this.selectedGroup || this.selectedGroup.id === undefined) return;

    this.isSaving = true;
    
    this.loadSweetAlert().then(Swal => {
      Swal.fire({
        title: 'Saving Permissions Matrix...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    });

    this.groupService.savePermissions(this.selectedGroup.id, this.permissionsList).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.loadSweetAlert().then(Swal => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Permissions Saved',
            text: 'Security group permissions matrix has been updated successfully.'
          });
          this.closePermissionsPanel();
          this.loadGroups(); // reload to get the updated permissions mapped from server
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to save permissions list', err);
        this.loadSweetAlert().then(Swal => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Failed to update security permissions matrix.'
          });
        });
      }
    });
  }
}
