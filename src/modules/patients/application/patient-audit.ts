import type { AuditMetadata } from '../../audit/domain/audit-log.entity';
import type { AuditService } from '../../audit/application/audit.service';

export interface PatientAuditContext {
  actorUserId?: string | null;
  organizationId?: string | null;
  patientId?: string | null;
  action: string;
  metadata?: AuditMetadata;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordPatientAudit(
  auditService: AuditService,
  context: PatientAuditContext,
): Promise<void> {
  await auditService.recordEvent({
    actorUserId: context.actorUserId ?? null,
    organizationId: context.organizationId ?? null,
    action: context.action,
    resourceType: 'patient',
    resourceId: context.patientId ?? null,
    result: 'success',
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: context.metadata ?? {},
  });
}
