import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { Medication } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeRequiredText,
  validateUuid,
} from './medication.validation';

export interface CreateMedicationCommand {
  organizationId: string;
  genericName: string;
  activeIngredient: string;
  medicationForm: string;
  route: string;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class CreateMedicationUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: CreateMedicationCommand): Promise<Medication> {
    validateUuid(command.organizationId, 'organizationId');
    if (command.actorUserId) validateUuid(command.actorUserId, 'actorUserId');

    const medication = await this.repository.createMedication({
      organizationId: command.organizationId,
      genericName: normalizeRequiredText(command.genericName, 'genericName'),
      activeIngredient: normalizeRequiredText(
        command.activeIngredient,
        'activeIngredient',
      ),
      medicationForm: normalizeRequiredText(
        command.medicationForm,
        'medicationForm',
      ),
      route: normalizeRequiredText(command.route, 'route'),
      createdBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      action: 'medication.create',
      resourceId: medication.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: { activeIngredient: medication.activeIngredient },
    });

    return medication;
  }
}
