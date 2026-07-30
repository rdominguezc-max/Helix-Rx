import { describe, expect, it } from 'vitest';
import type { RoleRepository } from '../domain/role.repository';
import { CreateRoleUseCase } from './create-role.use-case';
import { buildRoleFixture } from './role.fixture';

describe('CreateRoleUseCase', () => {
  it('normalizes and creates a role', async () => {
    const roleRepository = {
      create: async (data) => buildRoleFixture(data),
      findById: async () => null,
      findByCode: async () => null,
      assignPermission: async () => {
        throw new Error('Not used');
      },
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const useCase = new CreateRoleUseCase(roleRepository);

    const result = await useCase.execute({
      code: ' PHYSICIAN ',
      name: '  Physician  ',
      description: '  Patient follow-up  ',
    });

    expect(result.code).toBe('physician');
    expect(result.name).toBe('Physician');
    expect(result.description).toBe('Patient follow-up');
    expect(result.status).toBe('active');
  });

  it('rejects duplicate role codes', async () => {
    const roleRepository = {
      create: async () => {
        throw new Error('Should not create duplicate role');
      },
      findById: async () => null,
      findByCode: async () => buildRoleFixture(),
      assignPermission: async () => {
        throw new Error('Not used');
      },
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const useCase = new CreateRoleUseCase(roleRepository);

    await expect(
      useCase.execute({
        code: 'physician',
        name: 'Physician',
        description: 'Patient follow-up',
      }),
    ).rejects.toThrow('role code is already in use');
  });
});
