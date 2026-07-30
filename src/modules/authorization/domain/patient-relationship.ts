export type LegacyPatientRelationship =
  | 'self'
  | 'physician'
  | 'medical_assistant'
  | 'caregiver';

export type PatientRelationship =
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

export interface PatientAuthorizationContext {
  patientId: string;
  relationship?: LegacyPatientRelationship;
}

export interface PatientAccessContext {
  patientId: string;
  organizationId: string;
  relatedUserId: string;
  relationshipType: PatientRelationship;
  hasActiveOrganizationMembership: boolean;
  hasActiveRelationship: boolean;
  hasActiveConsent: boolean;
}
