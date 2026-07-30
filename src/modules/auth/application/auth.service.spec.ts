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
} from './auth.fixture';
import { AuthService } from './auth.service';
import { AuthenticateFirebaseUserUseCase } from './authenticate-firebase-user.use-case';

describe('AuthService', () => {
  it('authenticates firebase users through the use case', async () => {
    const firebaseTokenVerifier = {
      verifyIdToken: async () => buildFirebaseUserFixture(),
    } satisfies FirebaseTokenVerifier;
    const userRepository = {
      create: async () => buildUserFixture(),
      findById: async () => null,
      findByEmail: async () => null,
      findByFirebaseUid: async () => buildUserFixture(),
      linkFirebaseUser: async () => buildUserFixture(),
      touchLoginActivity: async () => buildUserFixture(),
      updateBasicProfile: async () => null,
    } satisfies UserRepository;
    const coreRepository = {
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
      findFeatureFlag: async () => buildFeatureFlagFixture(true),
      listCatalogItems: async () => [],
    } satisfies CoreRepository;
    const auditRepository = {
      record: async () => buildAuditLogFixture(),
    } satisfies AuditLogRepository;
    const service = new AuthService(
      new AuthenticateFirebaseUserUseCase(
        firebaseTokenVerifier,
        userRepository,
        new IsFeatureEnabledUseCase(coreRepository),
        new AuditService(new RecordAuditEventUseCase(auditRepository)),
      ),
    );

    await expect(
      service.authenticateFirebaseUser({
        idToken: 'valid-firebase-token',
      }),
    ).resolves.toMatchObject({
      email: 'roberto@example.com',
    });
  });
});
