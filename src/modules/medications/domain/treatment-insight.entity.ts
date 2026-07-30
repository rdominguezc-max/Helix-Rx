export type InventoryRiskLevel =
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type TreatmentAlertType =
  | 'inventory_depleted'
  | 'inventory_low'
  | 'inventory_expiring';

export interface TreatmentAlert {
  type: TreatmentAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  inventoryLotId: string | null;
  expiresOn: Date | null;
}

export interface TreatmentAdherenceInsight {
  windowStartsAt: Date;
  windowEndsAt: Date;
  recordedEvents: number;
  confirmedDoses: number;
  omittedDoses: number;
  cancelledDoses: number;
  expectedDoses: number;
  unrecordedDoses: number;
  adherenceRate: number | null;
  onTimeDoses: number;
  punctualityRate: number | null;
}

export interface TreatmentInventoryInsight {
  totalAdministrationUnits: number;
  prescribedDoseCoverage: number;
  estimatedDosesRemaining: number;
  expectedDosesPerDay: number | null;
  estimatedDaysRemaining: number | null;
  estimatedDepletionAt: Date | null;
  nextExpirationOn: Date | null;
  riskLevel: InventoryRiskLevel;
}

export interface TreatmentInsight {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  asOf: Date;
  adherence: TreatmentAdherenceInsight;
  inventory: TreatmentInventoryInsight;
  alerts: TreatmentAlert[];
}
