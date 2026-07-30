import type { AuditLog } from '../../audit/domain/audit-log.entity';
import type { FeatureFlag } from '../../core/domain/feature-flag.entity';
import type { User } from '../../users/domain/user.entity';
import type { FirebaseAuthenticatedUser } from '../domain/firebase-authenticated-user';

export const userId = '11111111-1111-4111-8111-111111111111';
export const firebaseUid = 'firebase-user-1';

export function buildFirebaseUserFixture(
  overrides: Partial<FirebaseAuthenticatedUser> = {},
): FirebaseAuthenticatedUser {
  return {
    firebaseUid,
    email: 'roberto@example.com',
    emailVerified: true,
    displayName: 'Roberto Dominguez',
    ...overrides,
  };
}

export function buildUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: userId,
    firstName: 'Roberto',
    lastName: 'Dominguez',
    email: 'roberto@example.com',
    firebaseUid,
    emailVerified: true,
    phone: null,
    language: 'es',
    preferredLocale: 'es-MX',
    timezone: 'America/Hermosillo',
    status: 'active',
    lastLoginAt: null,
    lastActivityAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildFeatureFlagFixture(
  enabled: boolean,
): FeatureFlag {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    key: 'auth.firebase.enabled',
    enabled,
    organizationId: null,
    description: 'Firebase Auth',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

export function buildAuditLogFixture(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    actorUserId: null,
    organizationId: null,
    action: 'auth.firebase.login',
    resourceType: 'auth',
    resourceId: null,
    result: 'success',
    ipAddress: null,
    userAgent: null,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}
