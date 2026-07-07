import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentNumberService } from 'src/app/services/document-number.service';
import { DocumentNumber } from 'src/app/models/document-number.model';

interface DocumentModule {
  id?: number;
  moduleName: string;
  length: number;
  prefix: string;
  number: number;
  documentType: string;
  isActive: boolean;
}

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentNumberComponent implements OnInit {

  // ==========================================
  // SEARCH
  // ==========================================
  searchText = '';

  // ==========================================
  // MODAL / SAVE STATES
  // ==========================================
  showEditModal = false;
  isModalEditMode = false;
  isSaving = false;
  statusMessage = '';

  // ==========================================
  // TABLE DATA
  // ==========================================
  modules: DocumentModule[] = [];
  filteredModules: DocumentModule[] = [];

  // ==========================================
  // SELECTED MODULE
  // ==========================================
  selectedModule: DocumentModule = {
    id: undefined,
    moduleName: '',
    length: 0,
    prefix: '',
    number: 0,
    documentType: '',
    isActive: true
  };

  // ==========================================
  // CONSTRUCTOR
  // ==========================================
  constructor(
    private documentService: DocumentNumberService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadAllModules();
  }

  // ==========================================
  // LOAD ALL MODULES FROM BACKEND
  // ==========================================
  loadAllModules(): void {
    this.documentService.getAll().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          const dbList = response?.data || [];
          this.modules = dbList.map((item) => ({
            id: item.id,
            moduleName: item.documentName || '',
            length: item.length || 0,
            prefix: item.prefix || '',
            number: item.nextNumber || 0,
            documentType: item.documentType || '',
            isActive: item.isActive ?? true
          }));
          this.filteredModules = [...this.modules];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load document numbers:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // SEARCH
  // ==========================================
  searchModule(): void {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      this.filteredModules = [...this.modules];
      this.cdr.detectChanges();
      return;
    }
    this.filteredModules = this.modules.filter(module =>
      module.moduleName.toLowerCase().includes(keyword)
    );
    this.cdr.detectChanges();
  }

  // ==========================================
  // REFRESH
  // ==========================================
  refreshModules(): void {
    this.searchText = '';
    this.filteredModules = [...this.modules];
    this.cdr.detectChanges();
  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================
  // ==========================================
  // OPEN ADD MODAL
  // ==========================================
  openAddModal(): void {
    this.isModalEditMode = false;
    this.selectedModule = {
      id: undefined,
      moduleName: '',
      length: 6,
      prefix: '',
      number: 1,
      documentType: '',
      isActive: true
    };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  editModule(module: DocumentModule): void {
    this.isModalEditMode = true;
    this.selectedModule = { ...module };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  // ==========================================
  // SAVE CHANGES TO BACKEND
  // ==========================================
  saveModule(): void {
    if (this.isModalEditMode && !this.selectedModule.id) {
      alert('Cannot save: Invalid Document ID.');
      return;
    }

    if (!this.selectedModule.moduleName.trim()) {
      alert('Module Name is required.');
      return;
    }

    if (!this.selectedModule.documentType.trim()) {
      alert('Document Type is required.');
      return;
    }

    if (this.isSaving) return;

    // Map UI model back to backend DTO structure
    const payload: DocumentNumber = {
      documentName: this.selectedModule.moduleName.trim(),
      length: this.selectedModule.length || 0,
      prefix: (this.selectedModule.prefix || '').trim(),
      nextNumber: this.selectedModule.number || 0,
      documentType: this.selectedModule.documentType.trim(),
      isActive: this.selectedModule.isActive
    };

    this.isSaving = true;
    this.statusMessage = this.isModalEditMode ? 'Saving changes...' : 'Adding document...';
    this.cdr.detectChanges();

    if (this.isModalEditMode && this.selectedModule.id) {
      // EDIT MODE (PUT)
      this.documentService.update(this.selectedModule.id, payload).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Document updated successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            // Update local table array optimistically using spread operator
            this.modules = this.modules.map(x => {
              if (x.id === this.selectedModule.id) {
                return { ...this.selectedModule };
              }
              return x;
            });
            this.filteredModules = [...this.modules];

            this.showEditModal = false;
            this.isSaving = false;
            this.cdr.detectChanges();

            // Silently trigger background reload to keep state in sync
            this.loadAllModules();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to update document number:', err);
            alert(err.error?.message || err.message || 'Failed to update document setup.');
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // ADD MODE (POST)
      this.documentService.create(payload).subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            this.statusMessage = 'Document Added Successfully.';
            setTimeout(() => {
              this.ngZone.run(() => {
                this.statusMessage = '';
                this.cdr.detectChanges();
              });
            }, 4000);

            const created = response?.data || response || {};
            const newRow: DocumentModule = {
              id: created.id || Date.now(),
              moduleName: created.documentName ?? payload.documentName,
              length: created.length ?? payload.length,
              prefix: created.prefix ?? payload.prefix,
              number: created.nextNumber ?? payload.nextNumber,
              documentType: created.documentType ?? payload.documentType,
              isActive: created.isActive ?? payload.isActive
            };

            // Append to table array optimistically using spread operator
            this.modules = [...this.modules, newRow];
            this.filteredModules = [...this.modules];

            this.showEditModal = false;
            this.isSaving = false;
            this.cdr.detectChanges();

            // Silently trigger background reload to keep state in sync
            this.loadAllModules();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Failed to create document number:', err);
            alert(err.error?.message || err.message || 'Failed to create document setup.');
            this.isSaving = false;
            this.statusMessage = '';
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================
  closeModal(): void {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }
}