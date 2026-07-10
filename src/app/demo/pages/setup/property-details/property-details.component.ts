import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { PropertyComponent } from '../property-tab/property.component';

@Component({
  selector: 'app-property-details-page',
  standalone: true,
  imports: [SharedModule, FormsModule, PropertyComponent],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent {
  propertyId = '';
  isActive = true;
}
