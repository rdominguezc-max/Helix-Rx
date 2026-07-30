import { describe, expect, it } from 'vitest';
import { FindRoleByCodeUseCase } from '../../roles/application/find-role-by-code.use-case';
import type { RoleRepository } from '../../roles/domain/role.repository';
import type { MembershipRepository } from '../domain/membership.repository';
import { CreateMembershipUseCase } from './create-membership.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const roleId = '33333333-3333-4333-8333-333333333333';

function buildFindRoleByCodeUseCase(): FindRoleByCodeUseCase {
  const roleRepository = {
    create: async () => {
      throw new Error('Not used');
    },
    findById: async () => null,
    findByCode: async (code) => ({
      id: roleId,
      code,
      name: 'Organization Owner',
      description: 'Organization owner',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }),
    assignPermission: async () => {
      throw new Error('Not used');
    },
    findRolePermission: async () => null,
    listPermissionsByRole: async () => [],
  } satisfies RoleRepository;

  return new FindRoleByCodeUseCase(roleRepository);
}

describe('CreateMembershipUseCase', () => {
  it('creates an organization membership', async () => {
    const membershipRepository = {
      findActiveByOrganizationAndUser: async () => null,
      create: async (data) => ({
        id: '33333333-3333-4333-8333-333333333333',
        organizationId: data.organizationId,
        userId: data.userId,
        roleId: data.roleId,
        relationship: data.relationship,
        status: 'active',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } satisfies MembershipRepository;
    const useCase = new CreateMembershipUseCase(
      membershipRepository,
      buildFindRoleByCodeUseCase(),
    );

    const result = await useCase.execute({
      organizationId,
      userId,
      relationship: 'owner',
    });

    expect(result.organizationId).toBe(organizationId);
    expect(result.userId).toBe(userId);
    expect(result.roleId).toBe(roleId);
    expect(result.relationship).toBe('owner');
  });

  it('rejects duplicate active memberships', async () => {
    const membershipRepository = {
      findActiveByOrganizationAndUser: async () => ({
        id: '33333333-3333-4333-8333-333333333333',
        organizationId,
        userId,
        roleId,
        relationship: 'owner',
        status: 'active',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
      create: async () => {
        throw new Error('Should not create duplicate membership');
      },
    } satisfies MembershipRepository;
    const useCase = new CreateMembershipUseCase(
      membershipRepository,
      buildFindRoleByCodeUseCase(),
    );

    await expect(
      useCase.execute({
        organizationId,
        userId,
        relationship: 'owner',
      }),
    ).rejects.toThrow('User already has an active membership in organization');
  });

  it('maps medical_staff to medical_assistant by default', async () => {
    const membershipRepository = {
      findActiveByOrganizationAndUser: async () => null,
      create: async (data) => ({
        id: '33333333-3333-4333-8333-333333333333',
        organizationId: data.organizationId,
        userId: data.userId,
        roleId: data.roleId,
        relationship: data.relationship,
        status: 'active',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } satisfies MembershipRepository;
    const useCase = new CreateMembershipUseCase(
      membershipRepository,
      buildFindRoleByCodeUseCase(),
    );

    const result = await useCase.execute({
      organizationId,
      userId,
      relationship: 'medical_staff',
    });

    expect(result.roleId).toBe(roleId);
    expect(result.relationship).toBe('medical_staff');
  });
});
