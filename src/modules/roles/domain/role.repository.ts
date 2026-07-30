import type { Permission } from '../../permissions/domain/permission.entity';
import type { RolePermission } from './role-permission.entity';
import type { Role, RoleStatus } from './role.entity';

export interface CreateRoleData {
  code: string;
  name: string;
  description: string;
  status: RoleStatus;
}

export interface RoleRepository {
  create(data: CreateRoleData): Promise<Role>;
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  assignPermission(roleId: string, permissionId: string): Promise<RolePermission>;
  findRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null>;
  listPermissionsByRole(roleId: string): Promise<Permission[]>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
