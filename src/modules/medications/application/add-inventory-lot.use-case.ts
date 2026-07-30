import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { MedicationInventoryLot } from '../domain/medication-inventory.entity';
import {
  MEDICATION_INVENTORY_REPOSITORY,
  type MedicationInventoryRepository,
} from '../domain/medication-inventory.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeOptionalText,
  validatePositive,
  validateUuid,
} from './medication.validation';

export interface AddInventoryLotCommand {
  patientId: string;
  organizationId: string;
  presentationId: string;
  lotNumber?: string | null;
  quantityAcquired: number;
  acquiredAt?: Date | null;
  expiresOn?: Date | null;
  unitCost?: number | null;
  currencyCode?: string | null;
  pharmacyName?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AddInventoryLotUseCase {
  constructor(
    @Inject(MEDICATION_INVENTORY_REPOSITORY)
    private readonly repository: MedicationInventoryRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: AddInventoryLotCommand): Promise<MedicationInventoryLot> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.presentationId, 'presentationId');
    validatePositive(command.quantityAcquired, 'quantityAcquired');
    if (command.unitCost !== null && command.unitCost !== undefined) {
      if (!Number.isFinite(command.unitCost) || command.unitCost < 0) {
        throw new Error('unitCost cannot be negative');
      }
    }

    const currencyCode =
      normalizeOptionalText(command.currencyCode, 'currencyCode')?.toUpperCase() ??
      null;
    if (currencyCode && currencyCode.length !== 3) {
      throw new Error('currencyCode must contain 3 letters');
    }

    if (
      !(await this.repository.patientHasActiveMembership(
        command.patientId,
        command.organizationId,
      ))
    ) {
      throw new Error('patient is not active in organization');
    }
    if (
      !(await this.repository.presentationBelongsToOrganization(
        command.presentationId,
        command.organizationId,
      ))
    ) {
      throw new Error('medication presentation not found');
    }

    const lot = await this.repository.addLot({
      patientId: command.patientId,
      organizationId: command.organizationId,
      presentationId: command.presentationId,
      lotNumber: normalizeOptionalText(command.lotNumber, 'lotNumber'),
      quantityAcquired: command.quantityAcquired,
      acquiredAt: command.acquiredAt ?? null,
      expiresOn: command.expiresOn ?? null,
      unitCost: command.unitCost ?? null,
      currencyCode,
      pharmacyName: normalizeOptionalText(
        command.pharmacyName,
        'pharmacyName',
      ),
      createdBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: 'patient.medication_inventory.purchase',
      resourceId: lot.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        presentationId: command.presentationId,
        quantityAcquired: command.quantityAcquired,
      },
    });
    return lot;
  }
}
