import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { ExpectedDoseGenerationResult } from '../domain/expected-dose.entity';
import {
  EXPECTED_DOSE_REPOSITORY,
  type ExpectedDoseRepository,
} from '../domain/expected-dose.repository';
import { recordMedicationAudit } from './medication-audit';
import { validateUuid } from './medication.validation';

export interface GenerateExpectedDosesCommand {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
  asOf?: Date;
  missedGraceMinutes?: number;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class GenerateExpectedDosesUseCase {
  constructor(
    @Inject(EXPECTED_DOSE_REPOSITORY)
    private readonly repository: ExpectedDoseRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: GenerateExpectedDosesCommand,
  ): Promise<ExpectedDoseGenerationResult> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.treatmentId, 'treatmentId');
    validateWindow(command.windowStartsAt, command.windowEndsAt);
    const asOf = command.asOf ?? new Date();
    if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be valid');
    const missedGraceMinutes = validateGrace(command.missedGraceMinutes ?? 60);
    const result = await this.repository.generate({
      patientId: command.patientId,
      organizationId: command.organizationId,
      treatmentId: command.treatmentId,
      windowStartsAt: command.windowStartsAt,
      windowEndsAt: command.windowEndsAt,
      asOf,
      missedGraceMinutes,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: 'patient.treatment.expected_doses.generate',
      resourceId: command.treatmentId,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        windowStartsAt: command.windowStartsAt.toISOString(),
        windowEndsAt: command.windowEndsAt.toISOString(),
        generatedCount: result.generatedCount,
      },
    });
    return result;
  }
}

export function validateWindow(windowStartsAt: Date, windowEndsAt: Date): void {
  if (
    Number.isNaN(windowStartsAt.getTime()) ||
    Number.isNaN(windowEndsAt.getTime())
  ) {
    throw new Error('expected dose window must be valid');
  }
  if (windowEndsAt.getTime() < windowStartsAt.getTime()) {
    throw new Error('windowEndsAt cannot be before windowStartsAt');
  }
  const windowDays =
    (windowEndsAt.getTime() - windowStartsAt.getTime()) /
    (24 * 60 * 60 * 1000);
  if (windowDays > 90) {
    throw new Error('expected dose window cannot exceed 90 days');
  }
}

export function validateGrace(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 1440) {
    throw new Error('missedGraceMinutes must be an integer between 0 and 1440');
  }
  return value;
}
