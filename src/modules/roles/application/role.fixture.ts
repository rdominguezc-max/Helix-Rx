import type { Permission } from '../../permissions/domain/permission.entity';
import type { RolePermission } from '../domain/role-permission.entity';
import type { Role } from '../domain/role.entity';

export function buildRoleFixture(overrides: Partial<Role> = {}): Role {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'physician',
    name: 'Physician',
    description: 'Healthcare professional responsible for patient follow-up',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildRolePermissionFixture(
  overrides: Partial<RolePermission> = {},
): RolePermission {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    roleId: '11111111-1111-4111-8111-111111111111',
    permissionId: '33333333-3333-4333-8333-333333333333',
    createdAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildPermissionFixture(
  overrides: Partial<Permission> = {},
): Permission {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'patients.read',
    description: 'Read patients',
    resource: 'patients',
    action: 'read',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
