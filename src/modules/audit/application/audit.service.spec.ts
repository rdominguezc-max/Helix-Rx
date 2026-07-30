import { describe, expect, it } from 'vitest';
import type { AuditLogRepository } from '../domain/audit-log.repository';
import { AuditService } from './audit.service';
import { buildAuditLogFixture } from './audit.fixture';
import { RecordAuditEventUseCase } from './record-audit-event.use-case';

describe('AuditService', () => {
  it('records an audit event through the use case', async () => {
    const auditLogRepository = {
      record: async (data) =>
        buildAuditLogFixture({
          action: data.action,
          resourceType: data.resourceType,
          result: data.result,
        }),
    } satisfies AuditLogRepository;
    const useCase = new RecordAuditEventUseCase(auditLogRepository);
    const service = new AuditService(useCase);

    await expect(
      service.recordEvent({
        action: 'authorization.evaluate',
        resourceType: 'authorization',
        result: 'denied',
      }),
    ).resolves.toMatchObject({
      action: 'authorization.evaluate',
      resourceType: 'authorization',
      result: 'denied',
    });
  });
});
