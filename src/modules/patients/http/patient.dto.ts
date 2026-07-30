import type {
  AdministrativeSex,
  ConsentStatus,
  EmergencyContactStatus,
  PatientLanguage,
  PatientCareRelationshipStatus,
  PatientCareRelationshipType,
} from '../domain/patient.entity';

export interface RegisterPatientDto {
  userId?: string | null;
  externalReference?: string | null;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  administrativeSex?: AdministrativeSex | null;
  phone?: string | null;
  email?: string | null;
  countryCode?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  language?: PatientLanguage;
  preferredLocale?: string;
  timezone?: string;
}

export interface UpdatePatientProfileDto {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  administrativeSex?: AdministrativeSex | null;
  phone?: string | null;
  email?: string | null;
  countryCode?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  language?: PatientLanguage;
  preferredLocale?: string;
  timezone?: string;
}

export interface AddCareRelationshipDto {
  relatedUserId: string;
  relationshipType: PatientCareRelationshipType;
  accessScope?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  status?: PatientCareRelationshipStatus;
}

export interface AddEmergencyContactDto {
  name: string;
  relationshipLabel: string;
  phone: string;
  email?: string | null;
  preferredLanguage?: PatientLanguage | null;
  priority?: number;
  canReceiveAlerts?: boolean;
  notes?: string | null;
  status?: EmergencyContactStatus;
}

export interface AddConsentDto {
  consentType: string;
  scope?: string[];
  status?: ConsentStatus;
  subjectUserId?: string | null;
  grantedToUserId?: string | null;
  grantedToOrganizationId?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  source?: string;
  evidenceReference?: string | null;
}

export function parseOptionalDate(value?: string | null): Date | null {
  if (value === null || value === undefined || value.trim().length === 0) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('date must be valid');
  }

  return date;
}
