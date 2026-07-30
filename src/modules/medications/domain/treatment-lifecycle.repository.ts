import type { TreatmentStatus } from './medication.entity';
import type {
  DoseEventStatus,
  DoseTimingStatus,
  MedicationDoseEvent,
  TreatmentStatusEvent,
} from './treatment-lifecycle.entity';

export interface TreatmentInsightDoseSummary {
  eventStatus: DoseEventStatus;
  timingStatus: DoseTimingStatus | null;
  count: number;
}

export interface TreatmentInsightInventoryLot {
  id: string;
  quantityRemaining: number;
  strengthAmount: number;
  expiresOn: Date | null;
}

export interface TreatmentInsightSource {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  treatmentStatus: TreatmentStatus;
  doseAmount: number;
  doseUnit: string;
  frequencyIntervalHours: number | null;
  administrationTimesCount: number;
  isAsNeeded: boolean;
  doseSummaries: TreatmentInsightDoseSummary[];
  inventoryLots: TreatmentInsightInventoryLot[];
}

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
  getTreatmentInsightSource(
    patientId: string,
    organizationId: string,
    treatmentId: string,
    windowStartsAt: Date,
    windowEndsAt: Date,
  ): Promise<TreatmentInsightSource>;
}

export const TREATMENT_LIFECYCLE_REPOSITORY = Symbol(
  'TREATMENT_LIFECYCLE_REPOSITORY',
);
