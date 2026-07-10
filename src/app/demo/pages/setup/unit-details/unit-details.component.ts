import { Component } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { UnitComponent } from '../unit-tab/unit.component';

@Component({
  selector: 'app-unit-details-page',
  standalone: true,
  imports: [SharedModule, FormsModule, UnitComponent],
  templateUrl: './unit-details.component.html',
  styleUrls: ['./unit-details.component.scss']
})
export class UnitDetailsComponent {
  propertyId = '';
}
