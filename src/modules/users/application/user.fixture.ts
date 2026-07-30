import type { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';

export function buildUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Roberto',
    lastName: 'Dominguez',
    email: 'roberto@example.com',
    firebaseUid: null,
    emailVerified: false,
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

export function buildUserRepositoryFixture(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    create: async () => buildUserFixture(),
    findById: async () => null,
    findByEmail: async () => null,
    findByFirebaseUid: async () => null,
    linkFirebaseUser: async () => null,
    touchLoginActivity: async () => null,
    updateBasicProfile: async () => null,
    ...overrides,
  };
}
