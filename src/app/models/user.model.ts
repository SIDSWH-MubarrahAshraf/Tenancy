export interface SecurityGroup {
  id: number;
  groupCode: string;
  groupName: string;
  isActive: boolean;
}

export interface UserGroup {
  id: number;
  userId: number;
  securityGroupId: number;
  securityGroup?: SecurityGroup;
}

export interface User {
  id?: number;
  userName: string;
  fullName: string;
  email: string;
  password?: string;       // only sent on create/update, never received back meaningfully
  isActive: boolean;
  passwordExpiryDate?: string;
  groups?: UserGroup[];
  securityGroupIds?: number[]; // used only when POST/PUT
  selectedTheme?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}