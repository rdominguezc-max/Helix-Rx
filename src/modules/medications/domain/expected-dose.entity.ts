export type ExpectedDoseStoredStatus =
  | 'scheduled'
  | 'fulfilled'
  | 'cancelled';

export type ExpectedDoseStatus = ExpectedDoseStoredStatus | 'missed';

export interface ExpectedDose {
  id: string;
  patientTreatmentId: string;
  patientId: string;
  organizationId: string;
  scheduledFor: Date;
  timezone: string;
  status: ExpectedDoseStatus;
  medicationDoseEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpectedDoseGenerationResult {
  treatmentId: string;
  timezone: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
  generatedCount: number;
  expectedDoses: ExpectedDose[];
}
