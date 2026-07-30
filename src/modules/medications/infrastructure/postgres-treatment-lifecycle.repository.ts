import { Injectable } from '@nestjs/common';
import {
  type DatabaseQueryExecutor,
  DatabaseService,
} from '../../../database/database.service';
import type { TreatmentStatus } from '../domain/medication.entity';
import type {
  DoseInventoryAllocation,
  MedicationDoseEvent,
  TreatmentStatusEvent,
} from '../domain/treatment-lifecycle.entity';
import type {
  ChangeTreatmentStatusData,
  RecordDoseEventData,
  TreatmentInsightDoseSummary,
  TreatmentInsightInventoryLot,
  TreatmentInsightSource,
  TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';

interface TreatmentRow {
  id: string;
  patient_id: string;
  organization_id: string;
  medication_id: string;
  dose_amount: string;
  dose_unit: string;
  frequency_interval_hours: string | null;
  administration_times: unknown;
  is_as_needed: boolean;
  status: TreatmentStatus;
}

interface StatusEventRow {
  id: string;
  patient_treatment_id: string;
  previous_status: TreatmentStatus;
  new_status: TreatmentStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: Date;
}

interface DoseEventRow {
  id: string;
  patient_treatment_id: string;
  patient_id: string;
  organization_id: string;
  scheduled_for: Date;
  event_status: MedicationDoseEvent['eventStatus'];
  occurred_at: Date | null;
  timing_status: MedicationDoseEvent['timingStatus'];
  prescribed_dose_amount: string;
  prescribed_dose_unit: string;
  omission_reason: string | null;
  idempotency_key: string;
  recorded_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface InventoryCandidateRow {
  id: string;
  quantity_remaining: string;
  strength_amount: string;
}

interface AllocationRow {
  id: string;
  medication_dose_event_id: string;
  inventory_lot_id: string;
  inventory_movement_id: string;
  prescribed_amount_covered: string;
  administration_units_consumed: string;
  created_at: Date;
}

interface DoseSummaryRow {
  event_status: MedicationDoseEvent['eventStatus'];
  timing_status: MedicationDoseEvent['timingStatus'];
  event_count: string;
}

interface InsightInventoryRow {
  id: string;
  quantity_remaining: string;
  strength_amount: string;
  expires_on: Date | string | null;
}

const allowedTransitions: Record<TreatmentStatus, TreatmentStatus[]> = {
  draft: ['active', 'discontinued'],
  active: ['paused', 'completed', 'discontinued'],
  paused: ['active', 'completed', 'discontinued'],
  completed: [],
  discontinued: [],
};

function mapStatusEvent(row: StatusEventRow): TreatmentStatusEvent {
  return {
    id: row.id,
    patientTreatmentId: row.patient_treatment_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    reason: row.reason,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

function mapAllocation(row: AllocationRow): DoseInventoryAllocation {
  return {
    id: row.id,
    medicationDoseEventId: row.medication_dose_event_id,
    inventoryLotId: row.inventory_lot_id,
    inventoryMovementId: row.inventory_movement_id,
    prescribedAmountCovered: Number(row.prescribed_amount_covered),
    administrationUnitsConsumed: Number(row.administration_units_consumed),
    createdAt: row.created_at,
  };
}

function mapDoseEvent(
  row: DoseEventRow,
  allocations: DoseInventoryAllocation[],
): MedicationDoseEvent {
  return {
    id: row.id,
    patientTreatmentId: row.patient_treatment_id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    scheduledFor: row.scheduled_for,
    eventStatus: row.event_status,
    occurredAt: row.occurred_at,
    timingStatus: row.timing_status,
    prescribedDoseAmount: Number(row.prescribed_dose_amount),
    prescribedDoseUnit: row.prescribed_dose_unit,
    omissionReason: row.omission_reason,
    idempotencyKey: row.idempotency_key,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    allocations,
  };
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

@Injectable()
export class PostgresTreatmentLifecycleRepository
  implements TreatmentLifecycleRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

  async changeStatus(
    data: ChangeTreatmentStatusData,
  ): Promise<TreatmentStatusEvent> {
    return this.databaseService.transaction(async (executor) => {
      const treatmentResult = await executor.query<TreatmentRow>(
        `SELECT id, patient_id, organization_id, medication_id,
                dose_amount, dose_unit, frequency_interval_hours,
                administration_times, is_as_needed, status
         FROM patient_treatments
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3
           AND deleted_at IS NULL
         FOR UPDATE`,
        [data.treatmentId, data.patientId, data.organizationId],
      );
      const treatment = treatmentResult.rows[0];
      if (!treatment) throw new Error('treatment not found');
      if (!allowedTransitions[treatment.status].includes(data.newStatus)) {
        throw new Error(
          `treatment cannot transition from ${treatment.status} to ${data.newStatus}`,
        );
      }

      await executor.query(
        `UPDATE patient_treatments
         SET status = $2, updated_at = now(),
             discontinued_at = CASE WHEN $2 = 'discontinued' THEN now() ELSE discontinued_at END,
             discontinued_by = CASE WHEN $2 = 'discontinued' THEN $3 ELSE discontinued_by END,
             discontinuation_reason = CASE WHEN $2 = 'discontinued' THEN $4 ELSE discontinuation_reason END
         WHERE id = $1`,
        [treatment.id, data.newStatus, data.changedBy ?? null, data.reason ?? null],
      );
      const eventResult = await executor.query<StatusEventRow>(
        `INSERT INTO patient_treatment_status_events (
           patient_treatment_id, previous_status, new_status, reason, changed_by
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          treatment.id,
          treatment.status,
          data.newStatus,
          data.reason ?? null,
          data.changedBy ?? null,
        ],
      );
      return mapStatusEvent(eventResult.rows[0]);
    });
  }

  async recordDoseEvent(
    data: RecordDoseEventData,
  ): Promise<MedicationDoseEvent> {
    return this.databaseService.transaction(async (executor) => {
      const existing = await executor.query<DoseEventRow>(
        `SELECT * FROM medication_dose_events
         WHERE organization_id = $1 AND idempotency_key = $2
         LIMIT 1`,
        [data.organizationId, data.idempotencyKey],
      );
      if (existing.rows[0]) {
        const row = existing.rows[0];
        if (
          row.patient_id !== data.patientId ||
          row.patient_treatment_id !== data.treatmentId
        ) {
          throw new Error('idempotency key is already used by another dose');
        }
        return this.loadDoseEvent(row, executor);
      }

      const treatmentResult = await executor.query<TreatmentRow>(
        `SELECT id, patient_id, organization_id, medication_id,
                dose_amount, dose_unit, frequency_interval_hours,
                administration_times, is_as_needed, status
         FROM patient_treatments
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3
           AND deleted_at IS NULL
         FOR UPDATE`,
        [data.treatmentId, data.patientId, data.organizationId],
      );
      const treatment = treatmentResult.rows[0];
      if (!treatment) throw new Error('treatment not found');
      if (treatment.status !== 'active') {
        throw new Error('dose events require an active treatment');
      }

      const timingStatus =
        data.eventStatus === 'confirmed' && data.occurredAt
          ? this.timingStatus(data.scheduledFor, data.occurredAt)
          : null;
      const eventResult = await executor.query<DoseEventRow>(
        `INSERT INTO medication_dose_events (
           patient_treatment_id, patient_id, organization_id, scheduled_for,
           event_status, occurred_at, timing_status, prescribed_dose_amount,
           prescribed_dose_unit, omission_reason, idempotency_key, recorded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          treatment.id,
          data.patientId,
          data.organizationId,
          data.scheduledFor,
          data.eventStatus,
          data.occurredAt ?? null,
          timingStatus,
          treatment.dose_amount,
          treatment.dose_unit,
          data.omissionReason ?? null,
          data.idempotencyKey,
          data.recordedBy ?? null,
        ],
      );
      const event = eventResult.rows[0];

      if (data.eventStatus !== 'confirmed') {
        return mapDoseEvent(event, []);
      }

      const candidates = await executor.query<InventoryCandidateRow>(
        `SELECT lot.id, lot.quantity_remaining, presentation.strength_amount
         FROM patient_medication_inventory_lots lot
         JOIN medication_presentations presentation ON presentation.id = lot.presentation_id
         JOIN medications medication ON medication.id = presentation.medication_id
         WHERE lot.patient_id = $1 AND lot.organization_id = $2
           AND medication.id = $3
           AND lower(presentation.strength_unit) = lower($4)
           AND lot.status = 'active' AND lot.quantity_remaining > 0
           AND (lot.expires_on IS NULL OR lot.expires_on >= CURRENT_DATE)
           AND lot.deleted_at IS NULL AND presentation.deleted_at IS NULL
         ORDER BY lot.expires_on NULLS LAST, lot.acquired_at, lot.id
         FOR UPDATE OF lot`,
        [
          data.patientId,
          data.organizationId,
          treatment.medication_id,
          treatment.dose_unit,
        ],
      );

      let remainingDose = Number(treatment.dose_amount);
      const planned: Array<{
        lotId: string;
        units: number;
        covered: number;
        balanceAfter: number;
      }> = [];
      for (const candidate of candidates.rows) {
        if (remainingDose <= 0.00001) break;
        const strength = Number(candidate.strength_amount);
        const availableUnits = Number(candidate.quantity_remaining);
        const units = round(Math.min(availableUnits, remainingDose / strength));
        const covered = round(units * strength);
        if (units <= 0) continue;
        planned.push({
          lotId: candidate.id,
          units,
          covered,
          balanceAfter: round(availableUnits - units),
        });
        remainingDose = round(remainingDose - covered);
      }
      if (remainingDose > 0.00001) {
        throw new Error('insufficient compatible inventory for prescribed dose');
      }

      const allocations: DoseInventoryAllocation[] = [];
      for (const allocation of planned) {
        await executor.query(
          `UPDATE patient_medication_inventory_lots
           SET quantity_remaining = $2,
               status = CASE WHEN $2 = 0 THEN 'depleted' ELSE 'active' END,
               updated_at = now()
           WHERE id = $1`,
          [allocation.lotId, allocation.balanceAfter],
        );
        const movementResult = await executor.query<{ id: string }>(
          `INSERT INTO medication_inventory_movements (
             inventory_lot_id, patient_treatment_id, movement_type,
             quantity_delta, balance_after, reason, occurred_at, recorded_by
           )
           VALUES ($1, $2, 'administration', $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            allocation.lotId,
            treatment.id,
            -allocation.units,
            allocation.balanceAfter,
            `dose event ${event.id}`,
            data.occurredAt,
            data.recordedBy ?? null,
          ],
        );
        const allocationResult = await executor.query<AllocationRow>(
          `INSERT INTO medication_dose_inventory_allocations (
             medication_dose_event_id, inventory_lot_id, inventory_movement_id,
             prescribed_amount_covered, administration_units_consumed
           )
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            event.id,
            allocation.lotId,
            movementResult.rows[0].id,
            allocation.covered,
            allocation.units,
          ],
        );
        allocations.push(mapAllocation(allocationResult.rows[0]));
      }
      return mapDoseEvent(event, allocations);
    });
  }

  async listDoseEvents(
    patientId: string,
    organizationId: string,
    treatmentId: string,
  ): Promise<MedicationDoseEvent[]> {
    const result = await this.databaseService.query<DoseEventRow>(
      `SELECT * FROM medication_dose_events
       WHERE patient_id = $1 AND organization_id = $2
         AND patient_treatment_id = $3
       ORDER BY scheduled_for DESC, id DESC`,
      [patientId, organizationId, treatmentId],
    );
    return Promise.all(
      result.rows.map((row) => this.loadDoseEvent(row, this.databaseService)),
    );
  }

  async getTreatmentInsightSource(
    patientId: string,
    organizationId: string,
    treatmentId: string,
    windowStartsAt: Date,
    windowEndsAt: Date,
  ): Promise<TreatmentInsightSource> {
    const treatmentResult = await this.databaseService.query<TreatmentRow>(
      `SELECT id, patient_id, organization_id, medication_id,
              dose_amount, dose_unit, frequency_interval_hours,
              administration_times, is_as_needed, status
       FROM patient_treatments
       WHERE id = $1 AND patient_id = $2 AND organization_id = $3
         AND deleted_at IS NULL`,
      [treatmentId, patientId, organizationId],
    );
    const treatment = treatmentResult.rows[0];
    if (!treatment) throw new Error('treatment not found');

    const [doseResult, inventoryResult] = await Promise.all([
      this.databaseService.query<DoseSummaryRow>(
        `SELECT event_status, timing_status, count(*)::text AS event_count
         FROM medication_dose_events
         WHERE patient_treatment_id = $1
           AND patient_id = $2 AND organization_id = $3
           AND scheduled_for >= $4 AND scheduled_for <= $5
         GROUP BY event_status, timing_status`,
        [
          treatmentId,
          patientId,
          organizationId,
          windowStartsAt,
          windowEndsAt,
        ],
      ),
      this.databaseService.query<InsightInventoryRow>(
        `SELECT lot.id, lot.quantity_remaining,
                presentation.strength_amount, lot.expires_on
         FROM patient_medication_inventory_lots lot
         JOIN medication_presentations presentation
           ON presentation.id = lot.presentation_id
         WHERE lot.patient_id = $1 AND lot.organization_id = $2
           AND presentation.medication_id = $3
           AND lower(presentation.strength_unit) = lower($4)
           AND lot.status = 'active' AND lot.quantity_remaining > 0
           AND (lot.expires_on IS NULL OR lot.expires_on >= $5::date)
           AND lot.deleted_at IS NULL AND presentation.deleted_at IS NULL
         ORDER BY lot.expires_on NULLS LAST, lot.acquired_at, lot.id`,
        [
          patientId,
          organizationId,
          treatment.medication_id,
          treatment.dose_unit,
          windowEndsAt,
        ],
      ),
    ]);

    const administrationTimes = Array.isArray(treatment.administration_times)
      ? treatment.administration_times
      : [];
    const doseSummaries: TreatmentInsightDoseSummary[] = doseResult.rows.map(
      (row) => ({
        eventStatus: row.event_status,
        timingStatus: row.timing_status,
        count: Number(row.event_count),
      }),
    );
    const inventoryLots: TreatmentInsightInventoryLot[] =
      inventoryResult.rows.map((row) => ({
        id: row.id,
        quantityRemaining: Number(row.quantity_remaining),
        strengthAmount: Number(row.strength_amount),
        expiresOn:
          row.expires_on === null ? null : new Date(row.expires_on),
      }));

    return {
      patientId,
      organizationId,
      treatmentId,
      treatmentStatus: treatment.status,
      doseAmount: Number(treatment.dose_amount),
      doseUnit: treatment.dose_unit,
      frequencyIntervalHours:
        treatment.frequency_interval_hours === null
          ? null
          : Number(treatment.frequency_interval_hours),
      administrationTimesCount: administrationTimes.length,
      isAsNeeded: treatment.is_as_needed,
      doseSummaries,
      inventoryLots,
    };
  }

  private async loadDoseEvent(
    row: DoseEventRow,
    executor: DatabaseQueryExecutor,
  ): Promise<MedicationDoseEvent> {
    const result = await executor.query<AllocationRow>(
      `SELECT * FROM medication_dose_inventory_allocations
       WHERE medication_dose_event_id = $1
       ORDER BY created_at, id`,
      [row.id],
    );
    return mapDoseEvent(row, result.rows.map(mapAllocation));
  }

  private timingStatus(
    scheduledFor: Date,
    occurredAt: Date,
  ): MedicationDoseEvent['timingStatus'] {
    const deltaMinutes =
      (occurredAt.getTime() - scheduledFor.getTime()) / 60_000;
    if (deltaMinutes < -15) return 'early';
    if (deltaMinutes > 15) return 'late';
    return 'on_time';
  }
}
