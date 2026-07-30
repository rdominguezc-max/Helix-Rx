import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { TreatmentStatus } from '../domain/medication.entity';
import type { TreatmentStatusEvent } from '../domain/treatment-lifecycle.entity';
import {
  TREATMENT_LIFECYCLE_REPOSITORY,
  type TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';
import { recordMedicationAudit } from './medication-audit';
import { normalizeOptionalText, validateUuid } from './medication.validation';

export interface ChangeTreatmentStatusCommand {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  newStatus: TreatmentStatus;
  reason?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const allowedTargets = new Set<TreatmentStatus>([
  'active',
  'paused',
  'completed',
  'discontinued',
]);

@Injectable()
export class ChangeTreatmentStatusUseCase {
  constructor(
    @Inject(TREATMENT_LIFECYCLE_REPOSITORY)
    private readonly repository: TreatmentLifecycleRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: ChangeTreatmentStatusCommand,
  ): Promise<TreatmentStatusEvent> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.treatmentId, 'treatmentId');
    if (!allowedTargets.has(command.newStatus)) {
      throw new Error('newStatus is not supported');
    }
    const reason = normalizeOptionalText(command.reason, 'reason');
    if (command.newStatus === 'discontinued' && !reason) {
      throw new Error('reason is required to discontinue a treatment');
    }

    const event = await this.repository.changeStatus({
      patientId: command.patientId,
      organizationId: command.organizationId,
      treatmentId: command.treatmentId,
      newStatus: command.newStatus,
      reason,
      changedBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: 'patient.treatment.status_change',
      resourceId: command.treatmentId,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        reason,
      },
    });
    return event;
  }
}
