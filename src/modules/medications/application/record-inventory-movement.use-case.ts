import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type {
  InventoryMovementType,
  MedicationInventoryMovement,
} from '../domain/medication-inventory.entity';
import {
  MEDICATION_INVENTORY_REPOSITORY,
  type MedicationInventoryRepository,
} from '../domain/medication-inventory.repository';
import { recordMedicationAudit } from './medication-audit';
import {
  normalizeOptionalText,
  validateUuid,
} from './medication.validation';

export interface RecordInventoryMovementCommand {
  patientId: string;
  organizationId: string;
  inventoryLotId: string;
  patientTreatmentId?: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  reason?: string | null;
  occurredAt?: Date | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const allowedTypes = new Set<InventoryMovementType>([
  'administration',
  'adjustment',
  'waste',
  'return',
]);

@Injectable()
export class RecordInventoryMovementUseCase {
  constructor(
    @Inject(MEDICATION_INVENTORY_REPOSITORY)
    private readonly repository: MedicationInventoryRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: RecordInventoryMovementCommand,
  ): Promise<MedicationInventoryMovement> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.inventoryLotId, 'inventoryLotId');
    if (command.patientTreatmentId) {
      validateUuid(command.patientTreatmentId, 'patientTreatmentId');
    }
    if (!allowedTypes.has(command.movementType)) {
      throw new Error('movementType is not supported for manual recording');
    }
    if (!Number.isFinite(command.quantityDelta) || command.quantityDelta === 0) {
      throw new Error('quantityDelta must be non-zero');
    }
    if (
      ['administration', 'waste'].includes(command.movementType) &&
      command.quantityDelta > 0
    ) {
      throw new Error(`${command.movementType} quantityDelta must be negative`);
    }

    const movement = await this.repository.recordMovement({
      inventoryLotId: command.inventoryLotId,
      patientId: command.patientId,
      organizationId: command.organizationId,
      patientTreatmentId: command.patientTreatmentId ?? null,
      movementType: command.movementType,
      quantityDelta: command.quantityDelta,
      reason: normalizeOptionalText(command.reason, 'reason'),
      occurredAt: command.occurredAt ?? null,
      recordedBy: command.actorUserId ?? null,
    });

    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: `patient.medication_inventory.${command.movementType}`,
      resourceId: movement.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        inventoryLotId: command.inventoryLotId,
        quantityDelta: command.quantityDelta,
        balanceAfter: movement.balanceAfter,
      },
    });
    return movement;
  }
}
