import { Component, Input } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-unit',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss']
})
export class UnitComponent {
  @Input() propertyId = '';
  searchText = '';
  selectedProperty = '';
  properties = [
    {
      id: 'PROP-001',
      name: 'Al Noor Tower'
    },
    {
      id: 'PROP-002',
      name: 'Sky Heights'
    }
  ];
  unit: any = {
    unitId: '',
    unitNo: '',
    block: '',
    floor: '',
    unitType: '',
    taxAuthority: '',
    unitPurpose: '',
    description: '',
    unitSize: '',
    dewaPrefix: '',
    defaultAccount: '',
    acCharge: 0,
    electricityCharge: 0
  };
  units: any[] = [];
  filteredUnits: any[] = [];
  addUnit(): void {
    const row = {
      line: this.units.length + 1,
      ...this.unit,
      propertyId: this.propertyId
    };
    this.units.push(row);
    this.filteredUnits = [...this.units];
    this.unit = {
      unitId: '',
      unitNo: '',
      block: '',
      floor: '',
      unitType: '',
      taxAuthority: '',
      unitPurpose: '',
      description: '',
      unitSize: '',
      dewaPrefix: '',
      defaultAccount: '',
      acCharge: 0,
      electricityCharge: 0
    };
  }
  filterUnits(): void {
    const search = this.searchText.toLowerCase();
    this.filteredUnits = this.units.filter(unit =>
      unit.unitId.toLowerCase().includes(search) ||
      unit.unitNo.toLowerCase().includes(search)
    );
  }
  deleteUnit(line: number): void {
    this.units = this.units.filter(x => x.line !== line);
    this.filteredUnits = [...this.units];
  }
}
