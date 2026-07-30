import type { AuditService } from '../../audit/application/audit.service';
import type {
  Patient,
  PatientCareRelationship,
  PatientConsent,
  PatientEmergencyContact,
  PatientOrganizationMembership,
  PatientProfile,
} from '../domain/patient.entity';
import type {
  PatientRepository,
  RegisterPatientResult,
} from '../domain/patient.repository';

export const patientId = '11111111-1111-4111-8111-111111111111';
export const organizationId = '22222222-2222-4222-8222-222222222222';
export const userId = '33333333-3333-4333-8333-333333333333';
export const actorUserId = '44444444-4444-4444-8444-444444444444';
export const relatedUserId = '55555555-5555-4555-8555-555555555555';

export function buildPatientProfileFixture(
  overrides: Partial<PatientProfile> = {},
): PatientProfile {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    patientId,
    firstName: 'Ana',
    lastName: 'Lopez',
    birthDate: null,
    administrativeSex: null,
    phone: null,
    email: null,
    countryCode: null,
    bloodType: null,
    heightCm: null,
    weightKg: null,
    language: 'es',
    preferredLocale: 'es-MX',
    timezone: 'America/Hermosillo',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildPatientMembershipFixture(
  overrides: Partial<PatientOrganizationMembership> = {},
): PatientOrganizationMembership {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    patientId,
    organizationId,
    status: 'active',
    membershipType: 'primary',
    isPrimary: true,
    startsAt: new Date(),
    endsAt: null,
    createdBy: actorUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
    deletedAt: null,
    ...overrides,
  };
}

export function buildPatientFixture(overrides: Partial<Patient> = {}): Patient {
  const createdAt = new Date();

  return {
    id: patientId,
    identity: {
      patientId,
      userId: null,
      externalReference: null,
      createdAt,
    },
    profile: buildPatientProfileFixture(),
    primaryMembership: buildPatientMembershipFixture(),
    status: 'active',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    ...overrides,
  };
}

export function buildRegisterPatientResultFixture(
  overrides: Partial<RegisterPatientResult> = {},
): RegisterPatientResult {
  return {
    patient: buildPatientFixture(),
    event: {
      name: 'PatientRegistered',
      patientId,
      organizationId,
      patientOrganizationMembershipId: '77777777-7777-4777-8777-777777777777',
      registeredBy: actorUserId,
      registeredAt: new Date(),
      hasLinkedUser: false,
    },
    ...overrides,
  };
}

export function buildEmergencyContactFixture(
  overrides: Partial<PatientEmergencyContact> = {},
): PatientEmergencyContact {
  return {
    id: '88888888-8888-4888-8888-888888888888',
    patientId,
    name: 'Maria Lopez',
    relationshipLabel: 'Madre',
    phone: '+526621234567',
    email: null,
    preferredLanguage: 'es',
    priority: 1,
    canReceiveAlerts: true,
    notes: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildCareRelationshipFixture(
  overrides: Partial<PatientCareRelationship> = {},
): PatientCareRelationship {
  return {
    id: '99999999-9999-4999-8999-999999999999',
    patientId,
    organizationId,
    relatedUserId,
    relationshipType: 'caregiver',
    status: 'active',
    accessScope: ['profile.read'],
    startsAt: new Date(),
    endsAt: null,
    createdBy: actorUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
    deletedAt: null,
    ...overrides,
  };
}

export function buildConsentFixture(
  overrides: Partial<PatientConsent> = {},
): PatientConsent {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    patientId,
    organizationId,
    subjectUserId: null,
    grantedToUserId: relatedUserId,
    grantedToOrganizationId: null,
    consentType: 'caregiver_access',
    scope: ['profile.read'],
    status: 'active',
    effectiveFrom: new Date(),
    effectiveTo: null,
    capturedBy: actorUserId,
    capturedAt: new Date(),
    revokedBy: null,
    revokedAt: null,
    revocationReason: null,
    source: 'internal',
    evidenceReference: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildPatientRepositoryFixture(
  overrides: Partial<PatientRepository> = {},
): PatientRepository {
  return {
    register: async () => buildRegisterPatientResultFixture(),
    findById: async () => null,
    findActiveOrganizationMembership: async () => buildPatientMembershipFixture(),
    updateProfile: async () => buildPatientFixture(),
    addEmergencyContact: async () => buildEmergencyContactFixture(),
    listEmergencyContacts: async () => [buildEmergencyContactFixture()],
    addCareRelationship: async () => buildCareRelationshipFixture(),
    listCareRelationships: async () => [buildCareRelationshipFixture()],
    addConsent: async () => buildConsentFixture(),
    listConsents: async () => [buildConsentFixture()],
    addInsuranceCoverage: async () => {
      throw new Error('not implemented in fixture');
    },
    addReferenceIdentifier: async () => {
      throw new Error('not implemented in fixture');
    },
    ...overrides,
  };
}

export function buildAuditServiceFixture(): AuditService {
  return {
    recordEvent: async () =>
      ({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        actorUserId,
        organizationId,
        action: 'patients.test',
        resourceType: 'patient',
        resourceId: patientId,
        result: 'success',
        ipAddress: null,
        userAgent: null,
        metadata: {},
        createdAt: new Date(),
      }) as Awaited<ReturnType<AuditService['recordEvent']>>,
  } as unknown as AuditService;
}
