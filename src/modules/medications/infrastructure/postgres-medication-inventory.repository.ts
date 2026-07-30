import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type {
  MedicationInventoryLot,
  MedicationInventoryMovement,
} from '../domain/medication-inventory.entity';
import type {
  AddInventoryLotData,
  MedicationInventoryRepository,
  RecordInventoryMovementData,
} from '../domain/medication-inventory.repository';

interface LotRow {
  id: string;
  patient_id: string;
  organization_id: string;
  presentation_id: string;
  lot_number: string | null;
  quantity_acquired: string;
  quantity_remaining: string;
  acquired_at: Date;
  expires_on: Date | null;
  unit_cost: string | null;
  currency_code: string | null;
  pharmacy_name: string | null;
  status: MedicationInventoryLot['status'];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface MovementRow {
  id: string;
  inventory_lot_id: string;
  patient_treatment_id: string | null;
  movement_type: MedicationInventoryMovement['movementType'];
  quantity_delta: string;
  balance_after: string;
  reason: string | null;
  occurred_at: Date;
  recorded_by: string | null;
  created_at: Date;
}

function mapLot(row: LotRow): MedicationInventoryLot {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    presentationId: row.presentation_id,
    lotNumber: row.lot_number,
    quantityAcquired: Number(row.quantity_acquired),
    quantityRemaining: Number(row.quantity_remaining),
    acquiredAt: row.acquired_at,
    expiresOn: row.expires_on,
    unitCost: row.unit_cost === null ? null : Number(row.unit_cost),
    currencyCode: row.currency_code,
    pharmacyName: row.pharmacy_name,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapMovement(row: MovementRow): MedicationInventoryMovement {
  return {
    id: row.id,
    inventoryLotId: row.inventory_lot_id,
    patientTreatmentId: row.patient_treatment_id,
    movementType: row.movement_type,
    quantityDelta: Number(row.quantity_delta),
    balanceAfter: Number(row.balance_after),
    reason: row.reason,
    occurredAt: row.occurred_at,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

@Injectable()
export class PostgresMedicationInventoryRepository
  implements MedicationInventoryRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

  async presentationBelongsToOrganization(
    presentationId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.databaseService.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM medication_presentations presentation
         JOIN medications medication ON medication.id = presentation.medication_id
         WHERE presentation.id = $1
           AND (medication.organization_id IS NULL OR medication.organization_id = $2)
           AND presentation.status = 'active'
           AND presentation.deleted_at IS NULL
           AND medication.deleted_at IS NULL
       ) AS exists`,
      [presentationId, organizationId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async patientHasActiveMembership(
    patientId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.databaseService.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM patient_organization_memberships
         WHERE patient_id = $1 AND organization_id = $2
           AND status = 'active' AND deleted_at IS NULL
       ) AS exists`,
      [patientId, organizationId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async addLot(data: AddInventoryLotData): Promise<MedicationInventoryLot> {
    return this.databaseService.transaction(async (executor) => {
      const lotResult = await executor.query<LotRow>(
        `INSERT INTO patient_medication_inventory_lots (
           patient_id, organization_id, presentation_id, lot_number,
           quantity_acquired, quantity_remaining, acquired_at, expires_on,
           unit_cost, currency_code, pharmacy_name, created_by
         )
         VALUES (
           $1, $2, $3, $4, $5, $5, COALESCE($6, now()),
           $7, $8, $9, $10, $11
         )
         RETURNING *`,
        [
          data.patientId,
          data.organizationId,
          data.presentationId,
          data.lotNumber ?? null,
          data.quantityAcquired,
          data.acquiredAt ?? null,
          data.expiresOn ?? null,
          data.unitCost ?? null,
          data.currencyCode ?? null,
          data.pharmacyName ?? null,
          data.createdBy ?? null,
        ],
      );
      const lot = lotResult.rows[0];

      await executor.query(
        `INSERT INTO medication_inventory_movements (
           inventory_lot_id, movement_type, quantity_delta,
           balance_after, reason, occurred_at, recorded_by
         )
         VALUES ($1, 'purchase', $2, $2, 'initial purchase', $3, $4)`,
        [
          lot.id,
          data.quantityAcquired,
          data.acquiredAt ?? lot.acquired_at,
          data.createdBy ?? null,
        ],
      );
      return mapLot(lot);
    });
  }

  async listLots(
    patientId: string,
    organizationId: string,
  ): Promise<MedicationInventoryLot[]> {
    const result = await this.databaseService.query<LotRow>(
      `SELECT * FROM patient_medication_inventory_lots
       WHERE patient_id = $1 AND organization_id = $2
         AND deleted_at IS NULL
       ORDER BY expires_on NULLS LAST, acquired_at, id`,
      [patientId, organizationId],
    );
    return result.rows.map(mapLot);
  }

  async recordMovement(
    data: RecordInventoryMovementData,
  ): Promise<MedicationInventoryMovement> {
    return this.databaseService.transaction(async (executor) => {
      const lotResult = await executor.query<LotRow>(
        `SELECT * FROM patient_medication_inventory_lots
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3
           AND deleted_at IS NULL
         FOR UPDATE`,
        [data.inventoryLotId, data.patientId, data.organizationId],
      );
      const lot = lotResult.rows[0];
      if (!lot) throw new Error('inventory lot not found');

      const balanceAfter = Number(lot.quantity_remaining) + data.quantityDelta;
      if (balanceAfter < 0) throw new Error('insufficient inventory');
      if (balanceAfter > Number(lot.quantity_acquired)) {
        throw new Error('inventory balance cannot exceed acquired quantity');
      }

      const status = balanceAfter === 0 ? 'depleted' : 'active';
      await executor.query(
        `UPDATE patient_medication_inventory_lots
         SET quantity_remaining = $2, status = $3, updated_at = now()
         WHERE id = $1`,
        [lot.id, balanceAfter, status],
      );
      const movementResult = await executor.query<MovementRow>(
        `INSERT INTO medication_inventory_movements (
           inventory_lot_id, patient_treatment_id, movement_type,
           quantity_delta, balance_after, reason, occurred_at, recorded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()), $8)
         RETURNING *`,
        [
          lot.id,
          data.patientTreatmentId ?? null,
          data.movementType,
          data.quantityDelta,
          balanceAfter,
          data.reason ?? null,
          data.occurredAt ?? null,
          data.recordedBy ?? null,
        ],
      );
      return mapMovement(movementResult.rows[0]);
    });
  }
}
