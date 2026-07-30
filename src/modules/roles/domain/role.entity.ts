export type RoleStatus = 'active' | 'inactive';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
