import { describe, expect, it } from 'vitest';
import type { AuthorizationRepository } from '../domain/authorization.repository';
import { AuthorizationService } from './authorization.service';
import { EvaluateAuthorizationUseCase } from './evaluate-authorization.use-case';

describe('EvaluateAuthorizationUseCase', () => {
  it('delegates authorization evaluation', async () => {
    const authorizationRepository = {
      findActiveMembershipPermissions: async () => ({
        membershipId: '33333333-3333-4333-8333-333333333333',
        userId: '11111111-1111-4111-8111-111111111111',
        organizationId: '22222222-2222-4222-8222-222222222222',
        roleId: '44444444-4444-4444-8444-444444444444',
        roleCode: 'organization_admin',
        permissionCodes: ['organizations.read'],
      }),
      findPatientAccess: async () => null,
    } satisfies AuthorizationRepository;
    const service = new AuthorizationService(authorizationRepository);
    const useCase = new EvaluateAuthorizationUseCase(service);

    await expect(
      useCase.execute({
        userId: '11111111-1111-4111-8111-111111111111',
        organizationId: '22222222-2222-4222-8222-222222222222',
        permissionCode: 'organizations.read',
      }),
    ).resolves.toEqual({ decision: 'ALLOW' });
  });
});
