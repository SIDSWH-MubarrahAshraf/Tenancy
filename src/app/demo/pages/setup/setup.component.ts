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
  propertyId = '';
  isActive = true;
  activeTab: 'property' | 'unit' | 'document' = 'property';

  setTab(tab: 'property' | 'unit' | 'document'): void {
    this.activeTab = tab;
  }
}
