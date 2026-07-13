export interface DocumentNumber {
  id?: number;
  documentName: string;
  length: number;
  prefix: string;
  nextNumber: number;
  documentType: string;
  isActive: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
}
export type ApiResponse<T> = any;
