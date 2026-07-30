import type { TreatmentStatus } from '../domain/medication.entity';
import type { DoseEventStatus } from '../domain/treatment-lifecycle.entity';

export interface ChangeTreatmentStatusDto {
  newStatus: TreatmentStatus;
  reason?: string | null;
}

export interface RecordDoseEventDto {
  scheduledFor: string;
  eventStatus: DoseEventStatus;
  occurredAt?: string | null;
  omissionReason?: string | null;
  idempotencyKey: string;
}

export interface TreatmentInsightQueryDto {
  windowDays?: string;
  lowInventoryDays?: string;
  expirationWarningDays?: string;
  asOf?: string;
}

export function parseOptionalInsightInteger(
  value: string | undefined,
  label: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be an integer`);
  return Number(value);
}

export function parseLifecycleDate(
  value: string | null | undefined,
  label: string,
  required = false,
): Date | null {
  if (!value) {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be valid`);
  return date;
}
