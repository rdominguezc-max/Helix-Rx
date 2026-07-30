export type PermissionStatus = 'active' | 'inactive';

export interface Permission {
  id: string;
  code: string;
  description: string;
  resource: string;
  action: string;
  status: PermissionStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
