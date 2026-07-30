import { describe, expect, it } from 'vitest';
import type { PermissionRepository } from '../../permissions/domain/permission.repository';
import type { RoleRepository } from '../domain/role.repository';
import { AssignPermissionToRoleUseCase } from './assign-permission-to-role.use-case';
import { ListPermissionsByRoleUseCase } from './list-permissions-by-role.use-case';
import {
  buildPermissionFixture,
  buildRoleFixture,
  buildRolePermissionFixture,
} from './role.fixture';

const role = buildRoleFixture();
const permission = buildPermissionFixture();
const rolePermission = buildRolePermissionFixture({
  roleId: role.id,
  permissionId: permission.id,
});

describe('Role permission use cases', () => {
  it('assigns an existing permission to an existing role', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => role,
      findByCode: async () => null,
      assignPermission: async () => rolePermission,
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const permissionRepository = {
      create: async () => permission,
      findByCode: async () => null,
      listActive: async () => [permission],
    } satisfies PermissionRepository;
    const useCase = new AssignPermissionToRoleUseCase(
      roleRepository,
      permissionRepository,
    );

    await expect(
      useCase.execute({
        roleId: role.id,
        permissionId: permission.id,
      }),
    ).resolves.toEqual(rolePermission);
  });

  it('returns an existing assignment without duplicating it', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => role,
      findByCode: async () => null,
      assignPermission: async () => {
        throw new Error('Should not duplicate assignment');
      },
      findRolePermission: async () => rolePermission,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const permissionRepository = {
      create: async () => permission,
      findByCode: async () => null,
      listActive: async () => [permission],
    } satisfies PermissionRepository;
    const useCase = new AssignPermissionToRoleUseCase(
      roleRepository,
      permissionRepository,
    );

    await expect(
      useCase.execute({
        roleId: role.id,
        permissionId: permission.id,
      }),
    ).resolves.toEqual(rolePermission);
  });

  it('rejects missing permissions', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => role,
      findByCode: async () => null,
      assignPermission: async () => {
        throw new Error('Should not assign missing permission');
      },
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const permissionRepository = {
      create: async () => permission,
      findByCode: async () => null,
      listActive: async () => [],
    } satisfies PermissionRepository;
    const useCase = new AssignPermissionToRoleUseCase(
      roleRepository,
      permissionRepository,
    );

    await expect(
      useCase.execute({
        roleId: role.id,
        permissionId: permission.id,
      }),
    ).rejects.toThrow('permission not found');
  });

  it('lists permissions by role', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => role,
      findByCode: async () => null,
      assignPermission: async () => rolePermission,
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [permission],
    } satisfies RoleRepository;
    const useCase = new ListPermissionsByRoleUseCase(roleRepository);

    await expect(useCase.execute(role.id)).resolves.toEqual([permission]);
  });
});
