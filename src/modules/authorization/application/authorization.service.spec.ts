import { describe, expect, it } from 'vitest';
import type { AuthorizationMembership } from '../domain/authorization-membership';
import type { AuthorizationRepository } from '../domain/authorization.repository';
import type { PatientAccessContext } from '../domain/patient-relationship';
import { AuthorizationService } from './authorization.service';

const userId = '11111111-1111-4111-8111-111111111111';
const organizationId = '22222222-2222-4222-8222-222222222222';
const patientId = '55555555-5555-4555-8555-555555555555';

function buildMembership(
  overrides: Partial<AuthorizationMembership> = {},
): AuthorizationMembership {
  return {
    membershipId: '33333333-3333-4333-8333-333333333333',
    userId,
    organizationId,
    roleId: '44444444-4444-4444-8444-444444444444',
    roleCode: 'physician',
    permissionCodes: ['users.read', 'patients.read'],
    ...overrides,
  };
}

function buildPatientAccess(
  overrides: Partial<PatientAccessContext> = {},
): PatientAccessContext {
  return {
    patientId,
    organizationId,
    relatedUserId: userId,
    relationshipType: 'primary_physician',
    hasActiveOrganizationMembership: true,
    hasActiveRelationship: true,
    hasActiveConsent: true,
    ...overrides,
  };
}

function buildAuthorizationRepository(
  overrides: Partial<AuthorizationRepository> = {},
): AuthorizationRepository {
  return {
    findActiveMembershipPermissions: async () => buildMembership(),
    findPatientAccess: async () => buildPatientAccess(),
    ...overrides,
  };
}

describe('AuthorizationService', () => {
  it('allows a permission granted by the active membership role', async () => {
    const authorizationRepository = buildAuthorizationRepository();
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'users.read',
      }),
    ).resolves.toEqual({ decision: 'ALLOW' });
  });

  it('denies when no active membership exists', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findActiveMembershipPermissions: async () => null,
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'users.read',
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies when permission is not assigned to the role', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findActiveMembershipPermissions: async () =>
        buildMembership({ permissionCodes: ['users.read'] }),
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'organizations.write',
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies patient-scoped permissions without patient context', async () => {
    const authorizationRepository = buildAuthorizationRepository();
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'patients.read',
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('allows patient collection write when patient access is explicitly not required', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findActiveMembershipPermissions: async () =>
        buildMembership({ permissionCodes: ['patients.write'] }),
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'patients.write',
        patientAccessRequired: false,
      }),
    ).resolves.toEqual({ decision: 'ALLOW' });
  });

  it('allows patient-scoped permissions with active relationship and consent', async () => {
    const authorizationRepository = buildAuthorizationRepository();
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'patients.read',
        patientId,
      }),
    ).resolves.toEqual({ decision: 'ALLOW' });
  });

  it('denies patient-scoped permissions without active relationship', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findPatientAccess: async () => null,
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'patients.read',
        patientId,
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies patient-scoped permissions with revoked consent', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findPatientAccess: async () =>
        buildPatientAccess({ hasActiveConsent: false }),
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'patients.read',
        patientId,
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies patient-scoped permissions with expired consent', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findPatientAccess: async () =>
        buildPatientAccess({ hasActiveConsent: false }),
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId,
        permissionCode: 'medications.read',
        patientId,
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies patient-scoped permissions for incorrect organization', async () => {
    const authorizationRepository = buildAuthorizationRepository({
      findPatientAccess: async () => null,
    });
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId,
        organizationId: '66666666-6666-4666-8666-666666666666',
        permissionCode: 'patients.read',
        patientId,
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });

  it('denies invalid input without throwing', async () => {
    const authorizationRepository = buildAuthorizationRepository();
    const service = new AuthorizationService(authorizationRepository);

    await expect(
      service.evaluate({
        userId: 'not-a-uuid',
        organizationId,
        permissionCode: 'users.read',
      }),
    ).resolves.toEqual({ decision: 'DENY' });
  });
});
