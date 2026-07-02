import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { PropertyComponent } from './property-tab/property.component';
import { UnitComponent } from './unit-tab/unit.component';
@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [SharedModule, FormsModule, PropertyComponent, UnitComponent],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {
  // Master Property Context
  propertyId = '';
  propertyName = '';
  inactive = false;
  activeTab: 'property' | 'unit' | 'document' = 'property';
  addNewProperty(): void {
    this.propertyId = '';
    this.propertyName = '';
    this.inactive = false;
    console.log('New Property');
  }
  onSearch(): void {

  if (!this.propertyId.trim()) {
    alert('Please enter Property Code');
    return;
  }

  console.log('Searching', this.propertyId);

  // Call API here
}
  onNew(): void {
  this.propertyId = '';
  this.propertyName = '';
  this.inactive = false;

  this.activeTab = 'property';
}
  setTab(tab: 'property' | 'unit' | 'document'): void {
    this.activeTab = tab;
  }
}
