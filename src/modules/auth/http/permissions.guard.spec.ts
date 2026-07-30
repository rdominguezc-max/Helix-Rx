import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type { AuthorizationService } from '../../authorization/application/authorization.service';
import { PermissionsGuard } from './permissions.guard';
import { buildExecutionContext, buildHttpRequest } from './http-guard.fixture';

describe('PermissionsGuard', () => {
  it('allows requests when AuthorizationService allows required permissions', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata('helix:required_permissions', ['organizations.read'], handler);
    const authorizationService = {
      evaluate: async () => ({ decision: 'ALLOW' }),
    } as unknown as AuthorizationService;
    const auditService = {
      recordEvent: async () => undefined,
    } as unknown as AuditService;
    const guard = new PermissionsGuard(
      new Reflector(),
      authorizationService,
      auditService,
    );
    const request = buildHttpRequest({
      authenticatedUser: {
        userId: '11111111-1111-4111-8111-111111111111',
        firebaseUid: 'firebase-user',
        email: 'roberto@example.com',
        emailVerified: true,
        organizationId: '22222222-2222-4222-8222-222222222222',
      },
    });

    await expect(
      guard.canActivate(buildExecutionContext(request, handler)),
    ).resolves.toBe(true);
  });

  it('denies requests when AuthorizationService denies a permission', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata('helix:required_permissions', ['organizations.write'], handler);
    const authorizationService = {
      evaluate: async () => ({ decision: 'DENY' }),
    } as unknown as AuthorizationService;
    const auditService = {
      recordEvent: async () => undefined,
    } as unknown as AuditService;
    const guard = new PermissionsGuard(
      new Reflector(),
      authorizationService,
      auditService,
    );
    const request = buildHttpRequest({
      authenticatedUser: {
        userId: '11111111-1111-4111-8111-111111111111',
        firebaseUid: 'firebase-user',
        email: 'roberto@example.com',
        emailVerified: true,
        organizationId: '22222222-2222-4222-8222-222222222222',
      },
    });

    await expect(
      guard.canActivate(buildExecutionContext(request, handler)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows requests with no required permissions', async () => {
    const authorizationService = {
      evaluate: async () => {
        throw new Error('Should not authorize');
      },
    } as unknown as AuthorizationService;
    const auditService = {
      recordEvent: async () => undefined,
    } as unknown as AuditService;
    const guard = new PermissionsGuard(
      new Reflector(),
      authorizationService,
      auditService,
    );

    await expect(
      guard.canActivate(buildExecutionContext(buildHttpRequest())),
    ).resolves.toBe(true);
  });
});
