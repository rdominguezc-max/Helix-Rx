import { describe, expect, it } from 'vitest';
import type { AuditLogRepository } from '../domain/audit-log.repository';
import { buildAuditLogFixture } from './audit.fixture';
import { RecordAuditEventUseCase } from './record-audit-event.use-case';

describe('RecordAuditEventUseCase', () => {
  it('normalizes and records an audit event', async () => {
    const auditLogRepository = {
      record: async (data) =>
        buildAuditLogFixture({
          actorUserId: data.actorUserId ?? null,
          organizationId: data.organizationId ?? null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId ?? null,
          result: data.result,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          metadata: data.metadata ?? {},
        }),
    } satisfies AuditLogRepository;
    const useCase = new RecordAuditEventUseCase(auditLogRepository);

    const result = await useCase.execute({
      actorUserId: '22222222-2222-4222-8222-222222222222',
      organizationId: '33333333-3333-4333-8333-333333333333',
      action: ' USERS.CREATE ',
      resourceType: ' USERS ',
      resourceId: '44444444-4444-4444-8444-444444444444',
      result: 'success',
      ipAddress: ' 127.0.0.1 ',
      userAgent: ' vitest ',
      metadata: {
        source: 'unit-test',
      },
    });

    expect(result.action).toBe('users.create');
    expect(result.resourceType).toBe('users');
    expect(result.ipAddress).toBe('127.0.0.1');
    expect(result.userAgent).toBe('vitest');
    expect(result.metadata).toEqual({ source: 'unit-test' });
  });

  it('allows pre-auth audit events without actor or organization', async () => {
    const auditLogRepository = {
      record: async (data) =>
        buildAuditLogFixture({
          actorUserId: data.actorUserId ?? null,
          organizationId: data.organizationId ?? null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId ?? null,
          result: data.result,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          metadata: data.metadata ?? {},
        }),
    } satisfies AuditLogRepository;
    const useCase = new RecordAuditEventUseCase(auditLogRepository);

    const result = await useCase.execute({
      action: 'auth.login',
      resourceType: 'auth',
      result: 'failure',
      metadata: {
        reason: 'invalid_credentials',
      },
    });

    expect(result.actorUserId).toBeNull();
    expect(result.organizationId).toBeNull();
    expect(result.result).toBe('failure');
  });

  it('rejects unsupported audit results', async () => {
    const auditLogRepository = {
      record: async () => buildAuditLogFixture(),
    } satisfies AuditLogRepository;
    const useCase = new RecordAuditEventUseCase(auditLogRepository);

    await expect(
      useCase.execute({
        action: 'users.create',
        resourceType: 'users',
        result: 'unknown' as 'success',
      }),
    ).rejects.toThrow('audit result is not supported');
  });
});
