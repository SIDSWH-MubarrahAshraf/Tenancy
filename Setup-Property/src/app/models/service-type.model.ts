export interface ServiceType {
  id?: number;

  serviceTypeCode: string;
  description: string;

  revenueAccount: string;
  revenueAccountName: string;

  recurringEntry: boolean;

  recurringAccount: string;
  recurringAccountName: string;

  serviceMode: string;

  active: boolean;
}