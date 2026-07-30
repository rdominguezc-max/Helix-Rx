import type { InventoryMovementType } from '../domain/medication-inventory.entity';

export interface AddInventoryLotDto {
  presentationId: string;
  lotNumber?: string | null;
  quantityAcquired: number;
  acquiredAt?: string | null;
  expiresOn?: string | null;
  unitCost?: number | null;
  currencyCode?: string | null;
  pharmacyName?: string | null;
}

export interface RecordInventoryMovementDto {
  patientTreatmentId?: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  reason?: string | null;
  occurredAt?: string | null;
}

export interface DoseConversionDto {
  prescribedDose: number;
  prescribedUnit: string;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
}

export interface InventoryProjectionDto {
  totalUnitsRemaining: number;
  unitsPerDose: number;
  frequencyIntervalHours?: number | null;
  administrationTimes?: string[];
  isAsNeeded?: boolean;
  from?: string;
}

export function parseOptionalInventoryDate(
  value: string | null | undefined,
  label: string,
): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be valid`);
  return date;
}
