import type { AuditMetadata } from '../../audit/domain/audit-log.entity';
import type {
  AdministrativeSex,
  ConsentStatus,
  EmergencyContactStatus,
  InsuranceCoverageStatus,
  Patient,
  PatientCareRelationship,
  PatientCareRelationshipStatus,
  PatientCareRelationshipType,
  PatientConsent,
  PatientEmergencyContact,
  PatientInsuranceCoverage,
  PatientLanguage,
  PatientOrganizationMembership,
  PatientReferenceIdentifier,
  PatientStatus,
  ReferenceIdentifierStatus,
} from './patient.entity';
import type { PatientRegisteredEvent } from './patient-registered.event';

export interface PatientProfileData {
  firstName: string;
  lastName: string;
  birthDate?: Date | null;
  administrativeSex?: AdministrativeSex | null;
  phone?: string | null;
  email?: string | null;
  countryCode?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  language: PatientLanguage;
  preferredLocale: string;
  timezone: string;
}

export interface RegisterPatientData {
  organizationId: string;
  userId?: string | null;
  externalReference?: string | null;
  status: PatientStatus;
  profile: PatientProfileData;
  registeredBy?: string | null;
}

export interface RegisterPatientResult {
  patient: Patient;
  event: PatientRegisteredEvent;
}

export interface UpdatePatientProfileData extends PatientProfileData {
  patientId: string;
}

export interface AddEmergencyContactData {
  patientId: string;
  name: string;
  relationshipLabel: string;
  phone: string;
  email?: string | null;
  preferredLanguage?: PatientLanguage | null;
  priority: number;
  canReceiveAlerts: boolean;
  notes?: string | null;
  status: EmergencyContactStatus;
}

export interface AddCareRelationshipData {
  patientId: string;
  organizationId: string;
  relatedUserId: string;
  relationshipType: PatientCareRelationshipType;
  status: PatientCareRelationshipStatus;
  accessScope: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdBy?: string | null;
}

export interface AddConsentData {
  patientId: string;
  organizationId: string;
  subjectUserId?: string | null;
  grantedToUserId?: string | null;
  grantedToOrganizationId?: string | null;
  consentType: string;
  scope: string[];
  status: ConsentStatus;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  capturedBy?: string | null;
  source: string;
  evidenceReference?: string | null;
}

export interface AddInsuranceCoverageData {
  patientId: string;
  providerName: string;
  policyNumber?: string | null;
  groupNumber?: string | null;
  planName?: string | null;
  coverageType: string;
  countryCode?: string | null;
  validFrom?: Date | null;
  validTo?: Date | null;
  isPrimary: boolean;
  status: InsuranceCoverageStatus;
  metadata?: AuditMetadata;
}

export interface AddReferenceIdentifierData {
  patientId: string;
  type: string;
  value: string;
  issuer?: string | null;
  countryCode?: string | null;
  status: ReferenceIdentifierStatus;
  verifiedAt?: Date | null;
}

export interface ListPatientScopedData {
  patientId: string;
  organizationId: string;
}

export interface PatientRepository {
  register(data: RegisterPatientData): Promise<RegisterPatientResult>;
  findById(patientId: string): Promise<Patient | null>;
  findActiveOrganizationMembership(
    patientId: string,
    organizationId: string,
  ): Promise<PatientOrganizationMembership | null>;
  updateProfile(data: UpdatePatientProfileData): Promise<Patient | null>;
  addEmergencyContact(
    data: AddEmergencyContactData,
  ): Promise<PatientEmergencyContact>;
  addCareRelationship(
    data: AddCareRelationshipData,
  ): Promise<PatientCareRelationship>;
  listCareRelationships(
    data: ListPatientScopedData,
  ): Promise<PatientCareRelationship[]>;
  addConsent(data: AddConsentData): Promise<PatientConsent>;
  listConsents(data: ListPatientScopedData): Promise<PatientConsent[]>;
  listEmergencyContacts(
    data: ListPatientScopedData,
  ): Promise<PatientEmergencyContact[]>;
  addInsuranceCoverage(
    data: AddInsuranceCoverageData,
  ): Promise<PatientInsuranceCoverage>;
  addReferenceIdentifier(
    data: AddReferenceIdentifierData,
  ): Promise<PatientReferenceIdentifier>;
}

export const PATIENT_REPOSITORY = Symbol('PATIENT_REPOSITORY');
