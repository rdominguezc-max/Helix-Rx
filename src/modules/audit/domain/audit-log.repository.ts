import type { AuditLog, AuditMetadata, AuditResult } from './audit-log.entity';

export interface RecordAuditLogData {
  actorUserId?: string | null;
  organizationId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  result: AuditResult;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: AuditMetadata;
}

export interface AuditLogRepository {
  record(data: RecordAuditLogData): Promise<AuditLog>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
