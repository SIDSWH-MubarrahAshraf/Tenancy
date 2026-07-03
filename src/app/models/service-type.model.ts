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

  // Metadata/Auditing fields returned by backend response (optional for requests)
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
}