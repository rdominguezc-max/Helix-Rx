import type { AuditService } from '../../audit/application/audit.service';
import type { AuditMetadata } from '../../audit/domain/audit-log.entity';

export async function recordMedicationAudit(
  auditService: AuditService,
  input: {
    actorUserId?: string | null;
    organizationId: string;
    patientId?: string | null;
    action: string;
    resourceId?: string | null;
    metadata?: AuditMetadata;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<void> {
  await auditService.recordEvent({
    actorUserId: input.actorUserId ?? null,
    organizationId: input.organizationId,
    action: input.action,
    resourceType: input.patientId ? 'patient_treatment' : 'medication',
    resourceId: input.resourceId ?? null,
    result: 'success',
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.patientId ? { patientId: input.patientId } : {}),
    },
  });
}
