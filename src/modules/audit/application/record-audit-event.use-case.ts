import { Inject, Injectable } from '@nestjs/common';
import type { AuditLog } from '../domain/audit-log.entity';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
  type RecordAuditLogData,
} from '../domain/audit-log.repository';
import {
  normalizeAuditText,
  normalizeMetadata,
  normalizeOptionalText,
  validateAuditAction,
  validateAuditResult,
  validateOptionalUuid,
  validateResourceType,
} from './audit-log.validation';

export type RecordAuditEventCommand = RecordAuditLogData;

@Injectable()
export class RecordAuditEventUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(command: RecordAuditEventCommand): Promise<AuditLog> {
    const actorUserId = command.actorUserId ?? null;
    const organizationId = command.organizationId ?? null;
    const resourceId = command.resourceId ?? null;
    const action = normalizeAuditText(command.action);
    const resourceType = normalizeAuditText(command.resourceType);

    validateOptionalUuid(actorUserId, 'actorUserId');
    validateOptionalUuid(organizationId, 'organizationId');
    validateOptionalUuid(resourceId, 'resourceId');
    validateAuditAction(action);
    validateResourceType(resourceType);
    validateAuditResult(command.result);

    return this.auditLogRepository.record({
      actorUserId,
      organizationId,
      action,
      resourceType,
      resourceId,
      result: command.result,
      ipAddress: normalizeOptionalText(command.ipAddress),
      userAgent: normalizeOptionalText(command.userAgent),
      metadata: normalizeMetadata(command.metadata),
    });
  }
}
