import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type { AuthService } from '../application/auth.service';
import { FirebaseBearerAuthGuard } from './firebase-bearer-auth.guard';
import { buildExecutionContext, buildHttpRequest } from './http-guard.fixture';

describe('FirebaseBearerAuthGuard', () => {
  it('authenticates a bearer token and attaches request context', async () => {
    const authService = {
      authenticateFirebaseUser: async () => ({
        userId: '11111111-1111-4111-8111-111111111111',
        firebaseUid: 'firebase-user',
        email: 'roberto@example.com',
        emailVerified: true,
      }),
    } as unknown as AuthService;
    const auditService = {
      recordEvent: async () => undefined,
    } as unknown as AuditService;
    const request = buildHttpRequest({
      headers: {
        authorization: 'Bearer valid-token',
        'x-organization-id': '22222222-2222-4222-8222-222222222222',
        'user-agent': 'vitest',
      },
    });
    const guard = new FirebaseBearerAuthGuard(authService, auditService);

    await expect(
      guard.canActivate(buildExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.authenticatedUser).toEqual({
      userId: '11111111-1111-4111-8111-111111111111',
      firebaseUid: 'firebase-user',
      email: 'roberto@example.com',
      emailVerified: true,
      organizationId: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('rejects missing bearer tokens with 401', async () => {
    const authService = {
      authenticateFirebaseUser: async () => {
        throw new Error('Should not authenticate');
      },
    } as unknown as AuthService;
    const auditService = {
      recordEvent: async () => undefined,
    } as unknown as AuditService;
    const guard = new FirebaseBearerAuthGuard(authService, auditService);

    await expect(
      guard.canActivate(buildExecutionContext(buildHttpRequest())),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
