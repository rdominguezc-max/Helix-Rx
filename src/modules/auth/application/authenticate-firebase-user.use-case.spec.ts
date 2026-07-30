import { describe, expect, it } from 'vitest';
import { AuditService } from '../../audit/application/audit.service';
import { RecordAuditEventUseCase } from '../../audit/application/record-audit-event.use-case';
import type { AuditLogRepository } from '../../audit/domain/audit-log.repository';
import { IsFeatureEnabledUseCase } from '../../core/application/is-feature-enabled.use-case';
import type { CoreRepository } from '../../core/domain/core.repository';
import type { UserRepository } from '../../users/domain/user.repository';
import type { FirebaseTokenVerifier } from '../domain/firebase-token-verifier';
import {
  buildAuditLogFixture,
  buildFeatureFlagFixture,
  buildFirebaseUserFixture,
  buildUserFixture,
  firebaseUid,
  userId,
} from './auth.fixture';
import { AuthenticateFirebaseUserUseCase } from './authenticate-firebase-user.use-case';

function buildCoreRepository(enabled: boolean): CoreRepository {
  return {
    getSystemParameter: async () => null,
    setSystemParameter: async () => {
      throw new Error('Not used');
    },
    getOrganizationSetting: async () => null,
    setOrganizationSetting: async () => {
      throw new Error('Not used');
    },
    listSupportedLanguages: async () => [],
    listSupportedTimezones: async () => [],
    findFeatureFlag: async () => buildFeatureFlagFixture(enabled),
    listCatalogItems: async () => [],
  };
}

function buildAuditService(): AuditService {
  const auditLogRepository = {
    record: async (data) =>
      buildAuditLogFixture({
        actorUserId: data.actorUserId ?? null,
        action: data.action,
        result: data.result,
        metadata: data.metadata ?? {},
      }),
  } satisfies AuditLogRepository;

  return new AuditService(new RecordAuditEventUseCase(auditLogRepository));
}

describe('AuthenticateFirebaseUserUseCase', () => {
  it('authenticates an existing user by firebase uid', async () => {
    const firebaseTokenVerifier = {
      verifyIdToken: async () => buildFirebaseUserFixture(),
    } satisfies FirebaseTokenVerifier;
    const userRepository = {
      create: async () => {
        throw new Error('Should not create user');
      },
      findById: async () => null,
      findByEmail: async () => null,
      findByFirebaseUid: async () => buildUserFixture(),
      linkFirebaseUser: async () => {
        throw new Error('Should not link user');
      },
      touchLoginActivity: async () =>
        buildUserFixture({
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        }),
      updateBasicProfile: async () => null,
    } satisfies UserRepository;
    const useCase = new AuthenticateFirebaseUserUseCase(
      firebaseTokenVerifier,
      userRepository,
      new IsFeatureEnabledUseCase(buildCoreRepository(true)),
      buildAuditService(),
    );

    await expect(
      useCase.execute({
        idToken: 'valid-firebase-token',
      }),
    ).resolves.toEqual({
      userId,
      firebaseUid,
      email: 'roberto@example.com',
      emailVerified: true,
    });
  });

  it('links an existing internal user by email', async () => {
    const firebaseTokenVerifier = {
      verifyIdToken: async () => buildFirebaseUserFixture(),
    } satisfies FirebaseTokenVerifier;
    const userRepository = {
      create: async () => {
        throw new Error('Should not create user');
      },
      findById: async () => null,
      findByEmail: async () => buildUserFixture({ firebaseUid: null }),
      findByFirebaseUid: async () => null,
      linkFirebaseUser: async (data) =>
        buildUserFixture({
          id: data.userId,
          firebaseUid: data.firebaseUid,
          emailVerified: data.emailVerified,
        }),
      touchLoginActivity: async () => buildUserFixture(),
      updateBasicProfile: async () => null,
    } satisfies UserRepository;
    const useCase = new AuthenticateFirebaseUserUseCase(
      firebaseTokenVerifier,
      userRepository,
      new IsFeatureEnabledUseCase(buildCoreRepository(true)),
      buildAuditService(),
    );

    await expect(
      useCase.execute({
        idToken: 'valid-firebase-token',
      }),
    ).resolves.toMatchObject({
      userId,
      firebaseUid,
    });
  });

  it('creates an internal user from a verified firebase identity when missing', async () => {
    const firebaseTokenVerifier = {
      verifyIdToken: async () => buildFirebaseUserFixture(),
    } satisfies FirebaseTokenVerifier;
    const userRepository = {
      create: async (data) =>
        buildUserFixture({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          firebaseUid: data.firebaseUid ?? null,
          emailVerified: data.emailVerified ?? false,
        }),
      findById: async () => null,
      findByEmail: async () => null,
      findByFirebaseUid: async () => null,
      linkFirebaseUser: async () => null,
      touchLoginActivity: async () => buildUserFixture(),
      updateBasicProfile: async () => null,
    } satisfies UserRepository;
    const useCase = new AuthenticateFirebaseUserUseCase(
      firebaseTokenVerifier,
      userRepository,
      new IsFeatureEnabledUseCase(buildCoreRepository(true)),
      buildAuditService(),
    );

    await expect(
      useCase.execute({
        idToken: 'valid-firebase-token',
      }),
    ).resolves.toMatchObject({
      userId,
      firebaseUid,
    });
  });

  it('rejects firebase auth when the feature flag is disabled', async () => {
    const firebaseTokenVerifier = {
      verifyIdToken: async () => {
        throw new Error('Should not verify token');
      },
    } satisfies FirebaseTokenVerifier;
    const userRepository = {
      create: async () => {
        throw new Error('Not used');
      },
      findById: async () => null,
      findByEmail: async () => null,
      findByFirebaseUid: async () => null,
      linkFirebaseUser: async () => null,
      touchLoginActivity: async () => null,
      updateBasicProfile: async () => null,
    } satisfies UserRepository;
    const useCase = new AuthenticateFirebaseUserUseCase(
      firebaseTokenVerifier,
      userRepository,
      new IsFeatureEnabledUseCase(buildCoreRepository(false)),
      buildAuditService(),
    );

    await expect(
      useCase.execute({
        idToken: 'valid-firebase-token',
      }),
    ).rejects.toThrow('firebase authentication is disabled');
  });
});
