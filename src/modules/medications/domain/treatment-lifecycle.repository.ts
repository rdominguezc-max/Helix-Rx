import type { TreatmentStatus } from './medication.entity';
import type {
  DoseEventStatus,
  MedicationDoseEvent,
  TreatmentStatusEvent,
} from './treatment-lifecycle.entity';

export interface ChangeTreatmentStatusData {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  newStatus: TreatmentStatus;
  reason?: string | null;
  changedBy?: string | null;
}

export interface RecordDoseEventData {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  scheduledFor: Date;
  eventStatus: DoseEventStatus;
  occurredAt?: Date | null;
  omissionReason?: string | null;
  idempotencyKey: string;
  recordedBy?: string | null;
}

export interface TreatmentLifecycleRepository {
  changeStatus(data: ChangeTreatmentStatusData): Promise<TreatmentStatusEvent>;
  recordDoseEvent(data: RecordDoseEventData): Promise<MedicationDoseEvent>;
  listDoseEvents(
    patientId: string,
    organizationId: string,
    treatmentId: string,
  ): Promise<MedicationDoseEvent[]>;
}

export const TREATMENT_LIFECYCLE_REPOSITORY = Symbol(
  'TREATMENT_LIFECYCLE_REPOSITORY',
);
