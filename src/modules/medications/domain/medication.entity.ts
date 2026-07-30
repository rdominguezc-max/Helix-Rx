export type MedicationStatus = 'active' | 'inactive';
export type TreatmentStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'discontinued';

export interface Medication {
  id: string;
  organizationId: string | null;
  genericName: string;
  activeIngredient: string;
  medicationForm: string;
  route: string;
  status: MedicationStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MedicationPresentation {
  id: string;
  medicationId: string;
  brandName: string | null;
  manufacturer: string | null;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
  packageQuantity: number;
  countryCode: string | null;
  status: MedicationStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientTreatment {
  id: string;
  patientId: string;
  organizationId: string;
  medicationId: string;
  prescribedBy: string | null;
  doseAmount: number;
  doseUnit: string;
  frequencyIntervalHours: number | null;
  administrationTimes: string[];
  instructions: string | null;
  startsOn: Date;
  endsOn: Date | null;
  isAsNeeded: boolean;
  status: TreatmentStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
