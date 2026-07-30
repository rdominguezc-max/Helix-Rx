import type {
  Medication,
  MedicationPresentation,
  PatientTreatment,
} from './medication.entity';

export interface CreateMedicationData {
  organizationId: string;
  genericName: string;
  activeIngredient: string;
  medicationForm: string;
  route: string;
  createdBy?: string | null;
}

export interface CreatePresentationData {
  medicationId: string;
  brandName?: string | null;
  manufacturer?: string | null;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
  packageQuantity: number;
  countryCode?: string | null;
  createdBy?: string | null;
}

export interface CreateTreatmentData {
  patientId: string;
  organizationId: string;
  medicationId: string;
  prescribedBy?: string | null;
  doseAmount: number;
  doseUnit: string;
  frequencyIntervalHours?: number | null;
  administrationTimes: string[];
  instructions?: string | null;
  startsOn: Date;
  endsOn?: Date | null;
  isAsNeeded: boolean;
  createdBy?: string | null;
}

export interface MedicationRepository {
  createMedication(data: CreateMedicationData): Promise<Medication>;
  listMedications(organizationId: string): Promise<Medication[]>;
  findMedication(
    medicationId: string,
    organizationId: string,
  ): Promise<Medication | null>;
  createPresentation(
    data: CreatePresentationData,
  ): Promise<MedicationPresentation>;
  listPresentations(
    medicationId: string,
    organizationId: string,
  ): Promise<MedicationPresentation[]>;
  patientHasActiveMembership(
    patientId: string,
    organizationId: string,
  ): Promise<boolean>;
  createTreatment(data: CreateTreatmentData): Promise<PatientTreatment>;
  listPatientTreatments(
    patientId: string,
    organizationId: string,
  ): Promise<PatientTreatment[]>;
}

export const MEDICATION_REPOSITORY = Symbol('MEDICATION_REPOSITORY');
