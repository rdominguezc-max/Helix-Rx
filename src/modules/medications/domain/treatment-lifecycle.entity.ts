import type { TreatmentStatus } from './medication.entity';

export type DoseEventStatus = 'confirmed' | 'omitted' | 'cancelled';
export type DoseTimingStatus = 'early' | 'on_time' | 'late';

export interface TreatmentStatusEvent {
  id: string;
  patientTreatmentId: string;
  previousStatus: TreatmentStatus;
  newStatus: TreatmentStatus;
  reason: string | null;
  changedBy: string | null;
  changedAt: Date;
}

export interface DoseInventoryAllocation {
  id: string;
  medicationDoseEventId: string;
  inventoryLotId: string;
  inventoryMovementId: string;
  prescribedAmountCovered: number;
  administrationUnitsConsumed: number;
  createdAt: Date;
}

export interface MedicationDoseEvent {
  id: string;
  patientTreatmentId: string;
  patientId: string;
  organizationId: string;
  scheduledFor: Date;
  eventStatus: DoseEventStatus;
  occurredAt: Date | null;
  timingStatus: DoseTimingStatus | null;
  prescribedDoseAmount: number;
  prescribedDoseUnit: string;
  omissionReason: string | null;
  idempotencyKey: string;
  recordedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  allocations: DoseInventoryAllocation[];
}
