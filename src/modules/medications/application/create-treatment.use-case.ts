import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { PatientTreatment } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeAdministrationTimes,
  normalizeOptionalText,
  normalizeRequiredText,
  validateDateRange,
  validatePositive,
  validateTreatmentSchedule,
  validateUuid,
} from './medication.validation';

export interface CreateTreatmentCommand {
  patientId: string;
  organizationId: string;
  medicationId: string;
  prescribedBy?: string | null;
  doseAmount: number;
  doseUnit: string;
  frequencyIntervalHours?: number | null;
  administrationTimes?: string[];
  instructions?: string | null;
  startsOn: Date;
  endsOn?: Date | null;
  isAsNeeded?: boolean;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class CreateTreatmentUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: CreateTreatmentCommand): Promise<PatientTreatment> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.medicationId, 'medicationId');
    if (command.prescribedBy) validateUuid(command.prescribedBy, 'prescribedBy');
    validatePositive(command.doseAmount, 'doseAmount');

    const administrationTimes = normalizeAdministrationTimes(
      command.administrationTimes,
    );
    const frequencyIntervalHours = command.frequencyIntervalHours ?? null;
    const isAsNeeded = command.isAsNeeded ?? false;
    const endsOn = command.endsOn ?? null;
    validateTreatmentSchedule({
      isAsNeeded,
      frequencyIntervalHours,
      administrationTimes,
    });
    validateDateRange(command.startsOn, endsOn);

    if (
      !(await this.repository.patientHasActiveMembership(
        command.patientId,
        command.organizationId,
      ))
    ) {
      throw new Error('patient is not active in organization');
    }
    if (
      !(await this.repository.findMedication(
        command.medicationId,
        command.organizationId,
      ))
    ) {
      throw new Error('medication not found');
    }

    const treatment = await this.repository.createTreatment({
      patientId: command.patientId,
      organizationId: command.organizationId,
      medicationId: command.medicationId,
      prescribedBy: command.prescribedBy ?? null,
      doseAmount: command.doseAmount,
      doseUnit: normalizeRequiredText(command.doseUnit, 'doseUnit'),
      frequencyIntervalHours,
      administrationTimes,
      instructions: normalizeOptionalText(command.instructions, 'instructions'),
      startsOn: command.startsOn,
      endsOn,
      isAsNeeded,
      createdBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: 'patient.treatment.create',
      resourceId: treatment.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: { medicationId: command.medicationId },
    });

    return treatment;
  }
}
