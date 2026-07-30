import { describe, expect, it } from 'vitest';
import type { RoleRepository } from '../domain/role.repository';
import { FindRoleByCodeUseCase } from './find-role-by-code.use-case';
import { FindRoleByIdUseCase } from './find-role-by-id.use-case';
import { buildRoleFixture } from './role.fixture';

const role = buildRoleFixture();

describe('FindRole use cases', () => {
  it('finds a role by id', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => role,
      findByCode: async () => null,
      assignPermission: async () => {
        throw new Error('Not used');
      },
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const useCase = new FindRoleByIdUseCase(roleRepository);

    await expect(useCase.execute(role.id)).resolves.toEqual(role);
  });

  it('normalizes code before finding a role', async () => {
    const roleRepository = {
      create: async () => role,
      findById: async () => null,
      findByCode: async (code) => (code === 'physician' ? role : null),
      assignPermission: async () => {
        throw new Error('Not used');
      },
      findRolePermission: async () => null,
      listPermissionsByRole: async () => [],
    } satisfies RoleRepository;
    const useCase = new FindRoleByCodeUseCase(roleRepository);

    await expect(useCase.execute(' PHYSICIAN ')).resolves.toEqual(role);
  });
});
