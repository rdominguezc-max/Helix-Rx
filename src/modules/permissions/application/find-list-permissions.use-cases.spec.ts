import { describe, expect, it } from 'vitest';
import type { PermissionRepository } from '../domain/permission.repository';
import { FindPermissionByCodeUseCase } from './find-permission-by-code.use-case';
import { ListActivePermissionsUseCase } from './list-active-permissions.use-case';

const permission = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'users.read',
  description: 'Read users',
  resource: 'users',
  action: 'read',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as const;

describe('Permission read use cases', () => {
  it('normalizes code before finding a permission', async () => {
    const permissionRepository = {
      create: async () => permission,
      findByCode: async (code) => (code === 'users.read' ? permission : null),
      listActive: async () => [],
    } satisfies PermissionRepository;
    const useCase = new FindPermissionByCodeUseCase(permissionRepository);

    await expect(useCase.execute(' USERS.READ ')).resolves.toEqual(permission);
  });

  it('lists active permissions', async () => {
    const permissionRepository = {
      create: async () => permission,
      findByCode: async () => null,
      listActive: async () => [permission],
    } satisfies PermissionRepository;
    const useCase = new ListActivePermissionsUseCase(permissionRepository);

    await expect(useCase.execute()).resolves.toEqual([permission]);
  });
});
