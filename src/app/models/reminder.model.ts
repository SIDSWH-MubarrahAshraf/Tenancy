export interface EmailTemplate {
  id?: number;
  templateCode: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  isActive: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}

export interface ReminderSetting {
  id?: number;
  reminderType: string;
  daysBefore: number;
  isActive: boolean;
  templateCode: string;
}
