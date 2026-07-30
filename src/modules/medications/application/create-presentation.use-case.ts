import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { MedicationPresentation } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeOptionalText,
  normalizeRequiredText,
  validatePositive,
  validateUuid,
} from './medication.validation';

export interface CreatePresentationCommand {
  organizationId: string;
  medicationId: string;
  brandName?: string | null;
  manufacturer?: string | null;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
  packageQuantity: number;
  countryCode?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class CreatePresentationUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: CreatePresentationCommand,
  ): Promise<MedicationPresentation> {
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.medicationId, 'medicationId');
    validatePositive(command.strengthAmount, 'strengthAmount');
    validatePositive(command.packageQuantity, 'packageQuantity');

    const medication = await this.repository.findMedication(
      command.medicationId,
      command.organizationId,
    );
    if (!medication) throw new Error('medication not found');

    const presentation = await this.repository.createPresentation({
      medicationId: command.medicationId,
      brandName: normalizeOptionalText(command.brandName, 'brandName'),
      manufacturer: normalizeOptionalText(
        command.manufacturer,
        'manufacturer',
      ),
      strengthAmount: command.strengthAmount,
      strengthUnit: normalizeRequiredText(
        command.strengthUnit,
        'strengthUnit',
      ),
      administrationUnit: normalizeRequiredText(
        command.administrationUnit,
        'administrationUnit',
      ),
      packageQuantity: command.packageQuantity,
      countryCode: normalizeOptionalText(command.countryCode, 'countryCode'),
      createdBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      action: 'medication.presentation.create',
      resourceId: presentation.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: { medicationId: command.medicationId },
    });

    return presentation;
  }
}
