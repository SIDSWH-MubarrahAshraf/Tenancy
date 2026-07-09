import { ApiResponse } from './user.model';

export interface Permission {
  id?: number;
  moduleCode: string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canPrint: boolean;
  canPost: boolean;
}

export interface SecurityGroupPermission {
  id?: number;
  securityGroupId?: number;
  permissionId?: number;
  securityGroup?: string;
  permission: Permission;
}

export interface SecurityGroup {
  id?: number;
  groupCode: string;
  groupName: string;
  isActive: boolean;
  permissions?: SecurityGroupPermission[];
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}
