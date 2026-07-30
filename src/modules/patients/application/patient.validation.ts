import type {
  AdministrativeSex,
  ConsentStatus,
  EmergencyContactStatus,
  InsuranceCoverageStatus,
  PatientCareRelationshipStatus,
  PatientCareRelationshipType,
  PatientLanguage,
  PatientOrganizationMembershipStatus,
  PatientStatus,
} from '../domain/patient.entity';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const timezonePattern = /^[A-Za-z]+(?:[_-][A-Za-z]+)*\/[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedPatientStatuses = new Set<PatientStatus>([
  'draft',
  'active',
  'inactive',
  'suspended',
  'archived',
  'deceased',
  'merged',
]);

const allowedMembershipStatuses = new Set<PatientOrganizationMembershipStatus>([
  'active',
  'inactive',
  'suspended',
  'revoked',
]);

const allowedAdministrativeSex = new Set<AdministrativeSex>([
  'female',
  'male',
  'other',
  'unknown',
]);

const allowedLanguages = new Set<PatientLanguage>(['es', 'en']);

const allowedCareRelationshipTypes = new Set<PatientCareRelationshipType>([
  'self',
  'primary_physician',
  'treating_physician',
  'covering_physician',
  'consulting_physician',
  'medical_assistant',
  'family_member',
  'caregiver',
  'emergency_contact',
  'organization_admin_viewer',
]);

const allowedCareRelationshipStatuses = new Set<PatientCareRelationshipStatus>([
  'active',
  'inactive',
  'suspended',
  'revoked',
]);

const allowedEmergencyContactStatuses = new Set<EmergencyContactStatus>([
  'active',
  'inactive',
]);

const allowedInsuranceStatuses = new Set<InsuranceCoverageStatus>([
  'active',
  'inactive',
  'expired',
]);

const allowedConsentStatuses = new Set<ConsentStatus>([
  'active',
  'denied',
  'revoked',
  'expired',
]);

export function normalizeText(value?: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');

  return normalized && normalized.length > 0 ? normalized : null;
}

export function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase();

  return normalized && normalized.length > 0 ? normalized : null;
}

export function normalizeCountryCode(value?: string | null): string | null {
  const normalized = value?.trim().toUpperCase();

  return normalized && normalized.length > 0 ? normalized : null;
}

export function normalizeAccessScope(scope?: string[]): string[] {
  return [...new Set(scope?.map((item) => item.trim()).filter(Boolean) ?? [])];
}

export function validateUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}

export function validateOptionalUuid(
  value: string | null | undefined,
  label: string,
): void {
  if (value !== null && value !== undefined) {
    validateUuid(value, label);
  }
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength = 120,
): void {
  const normalized = normalizeRequiredText(value);

  if (normalized.length < 1 || normalized.length > maxLength) {
    throw new Error(`${label} must be between 1 and ${maxLength} characters`);
  }
}

export function validateOptionalText(
  value: string | null | undefined,
  label: string,
  maxLength = 120,
): void {
  const normalized = normalizeText(value);

  if (normalized && normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
}

export function validateOptionalEmail(value: string | null): void {
  if (value && (value.length > 254 || !emailPattern.test(value))) {
    throw new Error('email must be valid');
  }
}

export function validateLanguage(language: PatientLanguage): void {
  if (!allowedLanguages.has(language)) {
    throw new Error('language is not supported');
  }
}

export function validateLocale(locale: string): void {
  if (!localePattern.test(locale)) {
    throw new Error('preferredLocale must be valid');
  }
}

export function validateTimezone(timezone: string): void {
  const normalizedTimezone = timezone.trim();

  if (
    normalizedTimezone.length < 3 ||
    normalizedTimezone.length > 80 ||
    !timezonePattern.test(normalizedTimezone)
  ) {
    throw new Error('timezone must be a valid IANA timezone identifier');
  }
}

export function validatePatientStatus(status: PatientStatus): void {
  if (!allowedPatientStatuses.has(status)) {
    throw new Error('patient status is not supported');
  }
}

export function validateMembershipStatus(
  status: PatientOrganizationMembershipStatus,
): void {
  if (!allowedMembershipStatuses.has(status)) {
    throw new Error('patient organization membership status is not supported');
  }
}

export function validateAdministrativeSex(
  administrativeSex: AdministrativeSex | null,
): void {
  if (administrativeSex && !allowedAdministrativeSex.has(administrativeSex)) {
    throw new Error('administrativeSex is not supported');
  }
}

export function validateBirthDate(birthDate: Date | null): void {
  if (birthDate && birthDate.getTime() > Date.now()) {
    throw new Error('birthDate cannot be in the future');
  }
}

export function validatePositiveMeasurement(
  value: number | null,
  label: string,
): void {
  if (value !== null && (!Number.isFinite(value) || value <= 0)) {
    throw new Error(`${label} must be positive`);
  }
}

export function validateCareRelationshipType(
  relationshipType: PatientCareRelationshipType,
): void {
  if (!allowedCareRelationshipTypes.has(relationshipType)) {
    throw new Error('care relationship type is not supported');
  }
}

export function validateCareRelationshipStatus(
  status: PatientCareRelationshipStatus,
): void {
  if (!allowedCareRelationshipStatuses.has(status)) {
    throw new Error('care relationship status is not supported');
  }
}

export function validateEmergencyContactStatus(
  status: EmergencyContactStatus,
): void {
  if (!allowedEmergencyContactStatuses.has(status)) {
    throw new Error('emergency contact status is not supported');
  }
}

export function validateInsuranceStatus(status: InsuranceCoverageStatus): void {
  if (!allowedInsuranceStatuses.has(status)) {
    throw new Error('insurance status is not supported');
  }
}

export function validateConsentStatus(status: ConsentStatus): void {
  if (!allowedConsentStatuses.has(status)) {
    throw new Error('consent status is not supported');
  }
}

export function validateDateRange(
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
  label: string,
): void {
  if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new Error(`${label} end date cannot be before start date`);
  }
}

export function validateAccessScope(scope: string[]): void {
  if (scope.some((item) => item.length > 80)) {
    throw new Error('access scope items must be 80 characters or fewer');
  }
}
