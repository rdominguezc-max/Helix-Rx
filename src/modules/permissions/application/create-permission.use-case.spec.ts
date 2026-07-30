import { describe, expect, it } from 'vitest';
import type { PermissionRepository } from '../domain/permission.repository';
import { CreatePermissionUseCase } from './create-permission.use-case';

describe('CreatePermissionUseCase', () => {
  it('normalizes and creates a permission', async () => {
    const permissionRepository = {
      findByCode: async () => null,
      listActive: async () => [],
      create: async (data) => ({
        id: '11111111-1111-4111-8111-111111111111',
        code: data.code,
        description: data.description,
        resource: data.resource,
        action: data.action,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } satisfies PermissionRepository;
    const useCase = new CreatePermissionUseCase(permissionRepository);

    const result = await useCase.execute({
      code: ' USERS.READ ',
      description: '  Read users  ',
    });

    expect(result.code).toBe('users.read');
    expect(result.resource).toBe('users');
    expect(result.action).toBe('read');
    expect(result.description).toBe('Read users');
  });

  it('rejects duplicate permission codes', async () => {
    const permissionRepository = {
      findByCode: async () => ({
        id: '11111111-1111-4111-8111-111111111111',
        code: 'users.read',
        description: 'Read users',
        resource: 'users',
        action: 'read',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
      listActive: async () => [],
      create: async () => {
        throw new Error('Should not create duplicate permission');
      },
    } satisfies PermissionRepository;
    const useCase = new CreatePermissionUseCase(permissionRepository);

    await expect(
      useCase.execute({
        code: 'users.read',
        description: 'Read users',
      }),
    ).rejects.toThrow('permission code is already in use');
  });

  it('rejects mismatched resource and action', async () => {
    const permissionRepository = {
      findByCode: async () => null,
      listActive: async () => [],
      create: async () => {
        throw new Error('Should not create invalid permission');
      },
    } satisfies PermissionRepository;
    const useCase = new CreatePermissionUseCase(permissionRepository);

    await expect(
      useCase.execute({
        code: 'users.read',
        description: 'Read users',
        resource: 'organizations',
        action: 'read',
      }),
    ).rejects.toThrow('permission code must match resource and action');
  });
});
