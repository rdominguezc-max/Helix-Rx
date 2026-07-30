import type { AuditMetadata } from '../../audit/domain/audit-log.entity';

export type PatientStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'archived'
  | 'deceased'
  | 'merged';

export type PatientLanguage = 'es' | 'en';
export type AdministrativeSex = 'female' | 'male' | 'other' | 'unknown';

export type PatientOrganizationMembershipStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'revoked';

export type PatientOrganizationMembershipType =
  | 'primary'
  | 'secondary'
  | 'referral'
  | 'program';

export type PatientCareRelationshipType =
  | 'self'
  | 'primary_physician'
  | 'treating_physician'
  | 'covering_physician'
  | 'consulting_physician'
  | 'medical_assistant'
  | 'family_member'
  | 'caregiver'
  | 'emergency_contact'
  | 'organization_admin_viewer';

export type PatientCareRelationshipStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'revoked';

export type EmergencyContactStatus = 'active' | 'inactive';
export type InsuranceCoverageStatus = 'active' | 'inactive' | 'expired';
export type ConsentStatus = 'active' | 'denied' | 'revoked' | 'expired';
export type ReferenceIdentifierStatus = 'active' | 'inactive' | 'verified';

export interface PatientIdentity {
  patientId: string;
  userId: string | null;
  externalReference: string | null;
  createdAt: Date;
}

export interface PatientProfile {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  administrativeSex: AdministrativeSex | null;
  phone: string | null;
  email: string | null;
  countryCode: string | null;
  bloodType: string | null;
  heightCm: number | null;
  weightKg: number | null;
  language: PatientLanguage;
  preferredLocale: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientOrganizationMembership {
  id: string;
  patientId: string;
  organizationId: string;
  status: PatientOrganizationMembershipStatus;
  membershipType: PatientOrganizationMembershipType;
  isPrimary: boolean;
  startsAt: Date;
  endsAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
  revocationReason: string | null;
  deletedAt: Date | null;
}

export interface Patient {
  id: string;
  identity: PatientIdentity;
  profile: PatientProfile;
  primaryMembership: PatientOrganizationMembership | null;
  status: PatientStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientCareRelationship {
  id: string;
  patientId: string;
  organizationId: string;
  relatedUserId: string;
  relationshipType: PatientCareRelationshipType;
  status: PatientCareRelationshipStatus;
  accessScope: string[];
  startsAt: Date;
  endsAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
  revocationReason: string | null;
  deletedAt: Date | null;
}

export interface PatientEmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationshipLabel: string;
  phone: string;
  email: string | null;
  preferredLanguage: PatientLanguage | null;
  priority: number;
  canReceiveAlerts: boolean;
  notes: string | null;
  status: EmergencyContactStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientInsuranceCoverage {
  id: string;
  patientId: string;
  providerName: string;
  policyNumber: string | null;
  groupNumber: string | null;
  planName: string | null;
  coverageType: string;
  countryCode: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  isPrimary: boolean;
  status: InsuranceCoverageStatus;
  metadata: AuditMetadata;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientConsent {
  id: string;
  patientId: string;
  organizationId: string;
  subjectUserId: string | null;
  grantedToUserId: string | null;
  grantedToOrganizationId: string | null;
  consentType: string;
  scope: string[];
  status: ConsentStatus;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  capturedBy: string | null;
  capturedAt: Date;
  revokedBy: string | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  source: string;
  evidenceReference: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientReferenceIdentifier {
  id: string;
  patientId: string;
  type: string;
  value: string;
  issuer: string | null;
  countryCode: string | null;
  status: ReferenceIdentifierStatus;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
