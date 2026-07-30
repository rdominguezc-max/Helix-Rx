import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type {
  DoseEventStatus,
  MedicationDoseEvent,
} from '../domain/treatment-lifecycle.entity';
import {
  TREATMENT_LIFECYCLE_REPOSITORY,
  type TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeOptionalText,
  normalizeRequiredText,
  validateUuid,
} from './medication.validation';

export interface RecordDoseEventCommand {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  scheduledFor: Date;
  eventStatus: DoseEventStatus;
  occurredAt?: Date | null;
  omissionReason?: string | null;
  idempotencyKey: string;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const allowedStatuses = new Set<DoseEventStatus>([
  'confirmed',
  'omitted',
  'cancelled',
]);

@Injectable()
export class RecordDoseEventUseCase {
  constructor(
    @Inject(TREATMENT_LIFECYCLE_REPOSITORY)
    private readonly repository: TreatmentLifecycleRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RecordDoseEventCommand): Promise<MedicationDoseEvent> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.treatmentId, 'treatmentId');
    if (!allowedStatuses.has(command.eventStatus)) {
      throw new Error('eventStatus is not supported');
    }
    if (Number.isNaN(command.scheduledFor.getTime())) {
      throw new Error('scheduledFor must be valid');
    }
    const occurredAt = command.occurredAt ?? null;
    if (
      command.eventStatus === 'confirmed' &&
      (!occurredAt || Number.isNaN(occurredAt.getTime()))
    ) {
      throw new Error('occurredAt is required for confirmed doses');
    }
    const omissionReason = normalizeOptionalText(
      command.omissionReason,
      'omissionReason',
    );
    if (command.eventStatus === 'omitted' && !omissionReason) {
      throw new Error('omissionReason is required for omitted doses');
    }
    const idempotencyKey = normalizeRequiredText(
      command.idempotencyKey,
      'idempotencyKey',
    );

    const event = await this.repository.recordDoseEvent({
      patientId: command.patientId,
      organizationId: command.organizationId,
      treatmentId: command.treatmentId,
      scheduledFor: command.scheduledFor,
      eventStatus: command.eventStatus,
      occurredAt,
      omissionReason,
      idempotencyKey,
      recordedBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: `patient.dose.${command.eventStatus}`,
      resourceId: event.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        treatmentId: command.treatmentId,
        scheduledFor: command.scheduledFor.toISOString(),
        allocationCount: event.allocations.length,
      },
    });
    return event;
  }
}
