import type { Permission } from './permission.entity';

export interface CreatePermissionData {
  code: string;
  description: string;
  resource: string;
  action: string;
}

export interface PermissionRepository {
  create(data: CreatePermissionData): Promise<Permission>;
  findByCode(code: string): Promise<Permission | null>;
  listActive(): Promise<Permission[]>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
