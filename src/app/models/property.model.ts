export interface Property {
  id?: number;
  propertyId: string;
  propertyName: string;
  propertyArea: string;
  propertyMakani: string;
  propertyCountry: string;
  propertyCity: string;
  propertyType: string;
  plotNo: string;
  landDmNumber: string;
  others: string;
  inactive: boolean;
  inactiveDate?: Date | null;
  remarks: string;
}