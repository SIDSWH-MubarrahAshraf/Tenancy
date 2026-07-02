import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DocumentModule {

   documentId: number;
  moduleName: string;
  length: number;
  prefix: string;
  number: number;

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
export class DocumentNumberComponent {

  // ==========================================
  // SEARCH
  // ==========================================

  searchText = '';

  // ==========================================
  // MODAL
  // ==========================================

  showEditModal = false;

  // ==========================================
  // TABLE DATA (Dummy Backend Data)
  // ==========================================

  modules: DocumentModule[] = [

    {
       documentId: 1,
      moduleName: 'Sales Invoice',
      length: 6,
      prefix: 'SI',
      number: 1001
    },

    {
       documentId: 2,
      moduleName: 'Purchase Invoice',
      length: 6,
      prefix: 'PI',
      number: 2001
    },

    {
       documentId: 3,
      moduleName: 'Receipt Voucher',
      length: 5,
      prefix: 'RV',
      number: 450
    },

    {
       documentId: 4,
      moduleName: 'Payment Voucher',
      length: 5,
      prefix: 'PV',
      number: 320
    },

    {
       documentId: 5,
      moduleName: 'Journal Voucher',
      length: 5,
      prefix: 'JV',
      number: 155
    },

    {
       documentId: 6,
      moduleName: 'Stock Transfer',
      length: 4,
      prefix: 'ST',
      number: 95
    }

  ];

  filteredModules: DocumentModule[] = [...this.modules];

  // ==========================================
  // SELECTED MODULE
  // ==========================================

  selectedModule: DocumentModule = {

    documentId: 0,
    moduleName: '',
    length: 0,
    prefix: '',
    number: 0

  };

  // ==========================================
  // SEARCH
  // ==========================================

  searchModule(): void {

    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) {

      this.filteredModules = [...this.modules];
      return;

    }

    this.filteredModules = this.modules.filter(module =>
      module.moduleName.toLowerCase().includes(keyword)
    );

  }

  // ==========================================
  // REFRESH
  // ==========================================

  refreshModules(): void {

    this.searchText = '';

    this.filteredModules = [...this.modules];

  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  editModule(module: DocumentModule): void {

    this.selectedModule = { ...module };

    this.showEditModal = true;

  }

  // ==========================================
  // SAVE
  // ==========================================

  saveModule(): void {

    const index = this.modules.findIndex(
      x => x.documentId === this.selectedModule.documentId
    );

    if (index !== -1) {

      this.modules[index] = { ...this.selectedModule };

      this.filteredModules = [...this.modules];

    }

    this.showEditModal = false;

    alert('Document updated successfully.');

  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  closeModal(): void {

    this.showEditModal = false;

  }

}