import { Injectable } from '@nestjs/common';
import {
  type DatabaseQueryExecutor,
  DatabaseService,
} from '../../../database/database.service';
import type { AuditMetadata } from '../../audit/domain/audit-log.entity';
import type {
  Patient,
  PatientCareRelationship,
  PatientConsent,
  PatientEmergencyContact,
  PatientInsuranceCoverage,
  PatientOrganizationMembership,
  PatientProfile,
  PatientReferenceIdentifier,
} from '../domain/patient.entity';
import type { PatientRegisteredEvent } from '../domain/patient-registered.event';
import type {
  AddCareRelationshipData,
  AddConsentData,
  AddEmergencyContactData,
  AddInsuranceCoverageData,
  AddReferenceIdentifierData,
  PatientRepository,
  RegisterPatientData,
  RegisterPatientResult,
  ListPatientScopedData,
  UpdatePatientProfileData,
} from '../domain/patient.repository';

interface PatientRow {
  id: string;
  user_id: string | null;
  external_reference: string | null;
  status: Patient['status'];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PatientProfileRow {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birth_date: Date | null;
  administrative_sex: PatientProfile['administrativeSex'];
  phone: string | null;
  email: string | null;
  country_code: string | null;
  blood_type: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  language: PatientProfile['language'];
  preferred_locale: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PatientOrganizationMembershipRow {
  id: string;
  patient_id: string;
  organization_id: string;
  status: PatientOrganizationMembership['status'];
  membership_type: PatientOrganizationMembership['membershipType'];
  is_primary: boolean;
  starts_at: Date;
  ends_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  deleted_at: Date | null;
}

interface PatientCareRelationshipRow {
  id: string;
  patient_id: string;
  organization_id: string;
  related_user_id: string;
  relationship_type: PatientCareRelationship['relationshipType'];
  status: PatientCareRelationship['status'];
  access_scope: unknown;
  starts_at: Date;
  ends_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  deleted_at: Date | null;
}

interface PatientEmergencyContactRow {
  id: string;
  patient_id: string;
  name: string;
  relationship_label: string;
  phone: string;
  email: string | null;
  preferred_language: PatientEmergencyContact['preferredLanguage'];
  priority: number;
  can_receive_alerts: boolean;
  notes: string | null;
  status: PatientEmergencyContact['status'];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PatientInsuranceCoverageRow {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number: string | null;
  group_number: string | null;
  plan_name: string | null;
  coverage_type: string;
  country_code: string | null;
  valid_from: Date | null;
  valid_to: Date | null;
  is_primary: boolean;
  status: PatientInsuranceCoverage['status'];
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PatientConsentRow {
  id: string;
  patient_id: string;
  organization_id: string;
  subject_user_id: string | null;
  granted_to_user_id: string | null;
  granted_to_organization_id: string | null;
  consent_type: string;
  scope: unknown;
  status: PatientConsent['status'];
  effective_from: Date;
  effective_to: Date | null;
  captured_by: string | null;
  captured_at: Date;
  revoked_by: string | null;
  revoked_at: Date | null;
  revocation_reason: string | null;
  source: string;
  evidence_reference: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PatientReferenceIdentifierRow {
  id: string;
  patient_id: string;
  type: string;
  value: string;
  issuer: string | null;
  country_code: string | null;
  status: PatientReferenceIdentifier['status'];
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const patientColumns = `
  id,
  user_id,
  external_reference,
  status,
  created_at,
  updated_at,
  deleted_at
`;

const profileColumns = `
  id,
  patient_id,
  first_name,
  last_name,
  birth_date,
  administrative_sex,
  phone,
  email,
  country_code,
  blood_type,
  height_cm,
  weight_kg,
  language,
  preferred_locale,
  timezone,
  created_at,
  updated_at,
  deleted_at
`;

const membershipColumns = `
  id,
  patient_id,
  organization_id,
  status,
  membership_type,
  is_primary,
  starts_at,
  ends_at,
  created_by,
  created_at,
  updated_at,
  revoked_at,
  revoked_by,
  revocation_reason,
  deleted_at
`;

function mapProfile(row: PatientProfileRow): PatientProfile {
  return {
    id: row.id,
    patientId: row.patient_id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    administrativeSex: row.administrative_sex,
    phone: row.phone,
    email: row.email,
    countryCode: row.country_code,
    bloodType: row.blood_type,
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    language: row.language,
    preferredLocale: row.preferred_locale,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapMembership(
  row: PatientOrganizationMembershipRow,
): PatientOrganizationMembership {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    status: row.status,
    membershipType: row.membership_type,
    isPrimary: row.is_primary,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    revocationReason: row.revocation_reason,
    deletedAt: row.deleted_at,
  };
}

function mapPatient(
  row: PatientRow,
  profile: PatientProfile,
  primaryMembership: PatientOrganizationMembership | null,
): Patient {
  return {
    id: row.id,
    identity: {
      patientId: row.id,
      userId: row.user_id,
      externalReference: row.external_reference,
      createdAt: row.created_at,
    },
    profile,
    primaryMembership,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function mapMetadata(value: unknown): AuditMetadata {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AuditMetadata)
    : {};
}

function mapCareRelationship(
  row: PatientCareRelationshipRow,
): PatientCareRelationship {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    relatedUserId: row.related_user_id,
    relationshipType: row.relationship_type,
    status: row.status,
    accessScope: mapStringArray(row.access_scope),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    revocationReason: row.revocation_reason,
    deletedAt: row.deleted_at,
  };
}

function mapEmergencyContact(
  row: PatientEmergencyContactRow,
): PatientEmergencyContact {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    relationshipLabel: row.relationship_label,
    phone: row.phone,
    email: row.email,
    preferredLanguage: row.preferred_language,
    priority: row.priority,
    canReceiveAlerts: row.can_receive_alerts,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapInsuranceCoverage(
  row: PatientInsuranceCoverageRow,
): PatientInsuranceCoverage {
  return {
    id: row.id,
    patientId: row.patient_id,
    providerName: row.provider_name,
    policyNumber: row.policy_number,
    groupNumber: row.group_number,
    planName: row.plan_name,
    coverageType: row.coverage_type,
    countryCode: row.country_code,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    isPrimary: row.is_primary,
    status: row.status,
    metadata: mapMetadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapConsent(row: PatientConsentRow): PatientConsent {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    subjectUserId: row.subject_user_id,
    grantedToUserId: row.granted_to_user_id,
    grantedToOrganizationId: row.granted_to_organization_id,
    consentType: row.consent_type,
    scope: mapStringArray(row.scope),
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    capturedBy: row.captured_by,
    capturedAt: row.captured_at,
    revokedBy: row.revoked_by,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
    source: row.source,
    evidenceReference: row.evidence_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapReferenceIdentifier(
  row: PatientReferenceIdentifierRow,
): PatientReferenceIdentifier {
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    value: row.value,
    issuer: row.issuer,
    countryCode: row.country_code,
    status: row.status,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

@Injectable()
export class PostgresPatientRepository implements PatientRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async register(data: RegisterPatientData): Promise<RegisterPatientResult> {
    return this.databaseService.transaction(async (executor) => {
      const patientResult = await executor.query<PatientRow>(
        `
          INSERT INTO patients (
            user_id,
            external_reference,
            status
          )
          VALUES ($1, $2, $3)
          RETURNING ${patientColumns}
        `,
        [data.userId ?? null, data.externalReference ?? null, data.status],
      );
      const patientRow = patientResult.rows[0];

      const profileResult = await executor.query<PatientProfileRow>(
        `
          INSERT INTO patient_profiles (
            patient_id,
            first_name,
            last_name,
            birth_date,
            administrative_sex,
            phone,
            email,
            country_code,
            blood_type,
            height_cm,
            weight_kg,
            language,
            preferred_locale,
            timezone
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14
          )
          RETURNING ${profileColumns}
        `,
        [
          patientRow.id,
          data.profile.firstName,
          data.profile.lastName,
          data.profile.birthDate ?? null,
          data.profile.administrativeSex ?? null,
          data.profile.phone ?? null,
          data.profile.email ?? null,
          data.profile.countryCode ?? null,
          data.profile.bloodType ?? null,
          data.profile.heightCm ?? null,
          data.profile.weightKg ?? null,
          data.profile.language,
          data.profile.preferredLocale,
          data.profile.timezone,
        ],
      );

      const membershipResult =
        await executor.query<PatientOrganizationMembershipRow>(
          `
            INSERT INTO patient_organization_memberships (
              patient_id,
              organization_id,
              status,
              membership_type,
              is_primary,
              created_by
            )
            VALUES ($1, $2, 'active', 'primary', true, $3)
            RETURNING ${membershipColumns}
          `,
          [patientRow.id, data.organizationId, data.registeredBy ?? null],
        );

      const membership = mapMembership(membershipResult.rows[0]);
      const patient = mapPatient(
        patientRow,
        mapProfile(profileResult.rows[0]),
        membership,
      );
      const event: PatientRegisteredEvent = {
        name: 'PatientRegistered',
        patientId: patient.id,
        organizationId: data.organizationId,
        patientOrganizationMembershipId: membership.id,
        registeredBy: data.registeredBy ?? null,
        registeredAt: patient.createdAt,
        hasLinkedUser: data.userId !== null && data.userId !== undefined,
      };

      return { patient, event };
    });
  }

  async findById(patientId: string): Promise<Patient | null> {
    return this.findPatientById(patientId, this.databaseService);
  }

  async findActiveOrganizationMembership(
    patientId: string,
    organizationId: string,
  ): Promise<PatientOrganizationMembership | null> {
    const result =
      await this.databaseService.query<PatientOrganizationMembershipRow>(
        `
          SELECT ${membershipColumns}
          FROM patient_organization_memberships
          WHERE patient_id = $1
            AND organization_id = $2
            AND status = 'active'
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [patientId, organizationId],
      );

    const row = result.rows[0];

    return row ? mapMembership(row) : null;
  }

  async updateProfile(data: UpdatePatientProfileData): Promise<Patient | null> {
    return this.databaseService.transaction(async (executor) => {
      const result = await executor.query<PatientProfileRow>(
        `
          UPDATE patient_profiles
          SET
            first_name = $2,
            last_name = $3,
            birth_date = $4,
            administrative_sex = $5,
            phone = $6,
            email = $7,
            country_code = $8,
            blood_type = $9,
            height_cm = $10,
            weight_kg = $11,
            language = $12,
            preferred_locale = $13,
            timezone = $14,
            updated_at = now()
          WHERE patient_id = $1
            AND deleted_at IS NULL
          RETURNING ${profileColumns}
        `,
        [
          data.patientId,
          data.firstName,
          data.lastName,
          data.birthDate ?? null,
          data.administrativeSex ?? null,
          data.phone ?? null,
          data.email ?? null,
          data.countryCode ?? null,
          data.bloodType ?? null,
          data.heightCm ?? null,
          data.weightKg ?? null,
          data.language,
          data.preferredLocale,
          data.timezone,
        ],
      );

      if (!result.rows[0]) {
        return null;
      }

      await executor.query(
        `
          UPDATE patients
          SET updated_at = now()
          WHERE id = $1
            AND deleted_at IS NULL
        `,
        [data.patientId],
      );

      return this.findPatientById(data.patientId, executor);
    });
  }

  async addEmergencyContact(
    data: AddEmergencyContactData,
  ): Promise<PatientEmergencyContact> {
    const result = await this.databaseService.query<PatientEmergencyContactRow>(
      `
        INSERT INTO patient_emergency_contacts (
          patient_id,
          name,
          relationship_label,
          phone,
          email,
          preferred_language,
          priority,
          can_receive_alerts,
          notes,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          patient_id,
          name,
          relationship_label,
          phone,
          email,
          preferred_language,
          priority,
          can_receive_alerts,
          notes,
          status,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.patientId,
        data.name,
        data.relationshipLabel,
        data.phone,
        data.email ?? null,
        data.preferredLanguage ?? null,
        data.priority,
        data.canReceiveAlerts,
        data.notes ?? null,
        data.status,
      ],
    );

    return mapEmergencyContact(result.rows[0]);
  }

  async addCareRelationship(
    data: AddCareRelationshipData,
  ): Promise<PatientCareRelationship> {
    const result = await this.databaseService.query<PatientCareRelationshipRow>(
      `
        INSERT INTO patient_care_relationships (
          patient_id,
          organization_id,
          related_user_id,
          relationship_type,
          status,
          access_scope,
          starts_at,
          ends_at,
          created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::jsonb,
          COALESCE($7, now()), $8, $9
        )
        RETURNING
          id,
          patient_id,
          organization_id,
          related_user_id,
          relationship_type,
          status,
          access_scope,
          starts_at,
          ends_at,
          created_by,
          created_at,
          updated_at,
          revoked_at,
          revoked_by,
          revocation_reason,
          deleted_at
      `,
      [
        data.patientId,
        data.organizationId,
        data.relatedUserId,
        data.relationshipType,
        data.status,
        JSON.stringify(data.accessScope),
        data.startsAt ?? null,
        data.endsAt ?? null,
        data.createdBy ?? null,
      ],
    );

    return mapCareRelationship(result.rows[0]);
  }

  async listCareRelationships(
    data: ListPatientScopedData,
  ): Promise<PatientCareRelationship[]> {
    const result = await this.databaseService.query<PatientCareRelationshipRow>(
      `
        SELECT
          id,
          patient_id,
          organization_id,
          related_user_id,
          relationship_type,
          status,
          access_scope,
          starts_at,
          ends_at,
          created_by,
          created_at,
          updated_at,
          revoked_at,
          revoked_by,
          revocation_reason,
          deleted_at
        FROM patient_care_relationships
        WHERE patient_id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
      `,
      [data.patientId, data.organizationId],
    );

    return result.rows.map(mapCareRelationship);
  }

  async addConsent(data: AddConsentData): Promise<PatientConsent> {
    const result = await this.databaseService.query<PatientConsentRow>(
      `
        INSERT INTO patient_consents (
          patient_id,
          organization_id,
          subject_user_id,
          granted_to_user_id,
          granted_to_organization_id,
          consent_type,
          scope,
          status,
          effective_from,
          effective_to,
          captured_by,
          source,
          evidence_reference
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8,
          COALESCE($9, now()), $10, $11, $12, $13
        )
        RETURNING
          id,
          patient_id,
          organization_id,
          subject_user_id,
          granted_to_user_id,
          granted_to_organization_id,
          consent_type,
          scope,
          status,
          effective_from,
          effective_to,
          captured_by,
          captured_at,
          revoked_by,
          revoked_at,
          revocation_reason,
          source,
          evidence_reference,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.patientId,
        data.organizationId,
        data.subjectUserId ?? null,
        data.grantedToUserId ?? null,
        data.grantedToOrganizationId ?? null,
        data.consentType,
        JSON.stringify(data.scope),
        data.status,
        data.effectiveFrom ?? null,
        data.effectiveTo ?? null,
        data.capturedBy ?? null,
        data.source,
        data.evidenceReference ?? null,
      ],
    );

    return mapConsent(result.rows[0]);
  }

  async listConsents(data: ListPatientScopedData): Promise<PatientConsent[]> {
    const result = await this.databaseService.query<PatientConsentRow>(
      `
        SELECT
          id,
          patient_id,
          organization_id,
          subject_user_id,
          granted_to_user_id,
          granted_to_organization_id,
          consent_type,
          scope,
          status,
          effective_from,
          effective_to,
          captured_by,
          captured_at,
          revoked_by,
          revoked_at,
          revocation_reason,
          source,
          evidence_reference,
          created_at,
          updated_at,
          deleted_at
        FROM patient_consents
        WHERE patient_id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
      `,
      [data.patientId, data.organizationId],
    );

    return result.rows.map(mapConsent);
  }

  async listEmergencyContacts(
    data: ListPatientScopedData,
  ): Promise<PatientEmergencyContact[]> {
    const result = await this.databaseService.query<PatientEmergencyContactRow>(
      `
        SELECT
          id,
          patient_id,
          name,
          relationship_label,
          phone,
          email,
          preferred_language,
          priority,
          can_receive_alerts,
          notes,
          status,
          created_at,
          updated_at,
          deleted_at
        FROM patient_emergency_contacts
        WHERE patient_id = $1
          AND deleted_at IS NULL
        ORDER BY priority ASC, created_at DESC, id DESC
      `,
      [data.patientId],
    );

    return result.rows.map(mapEmergencyContact);
  }

  async addInsuranceCoverage(
    data: AddInsuranceCoverageData,
  ): Promise<PatientInsuranceCoverage> {
    const result = await this.databaseService.query<PatientInsuranceCoverageRow>(
      `
        INSERT INTO patient_insurance_coverages (
          patient_id,
          provider_name,
          policy_number,
          group_number,
          plan_name,
          coverage_type,
          country_code,
          valid_from,
          valid_to,
          is_primary,
          status,
          metadata
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12::jsonb
        )
        RETURNING
          id,
          patient_id,
          provider_name,
          policy_number,
          group_number,
          plan_name,
          coverage_type,
          country_code,
          valid_from,
          valid_to,
          is_primary,
          status,
          metadata,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.patientId,
        data.providerName,
        data.policyNumber ?? null,
        data.groupNumber ?? null,
        data.planName ?? null,
        data.coverageType,
        data.countryCode ?? null,
        data.validFrom ?? null,
        data.validTo ?? null,
        data.isPrimary,
        data.status,
        JSON.stringify(data.metadata ?? {}),
      ],
    );

    return mapInsuranceCoverage(result.rows[0]);
  }

  async addReferenceIdentifier(
    data: AddReferenceIdentifierData,
  ): Promise<PatientReferenceIdentifier> {
    const result =
      await this.databaseService.query<PatientReferenceIdentifierRow>(
        `
          INSERT INTO patient_reference_identifiers (
            patient_id,
            type,
            value,
            issuer,
            country_code,
            status,
            verified_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING
            id,
            patient_id,
            type,
            value,
            issuer,
            country_code,
            status,
            verified_at,
            created_at,
            updated_at,
            deleted_at
        `,
        [
          data.patientId,
          data.type,
          data.value,
          data.issuer ?? null,
          data.countryCode ?? null,
          data.status,
          data.verifiedAt ?? null,
        ],
      );

    return mapReferenceIdentifier(result.rows[0]);
  }

  private async findPatientById(
    patientId: string,
    executor: DatabaseQueryExecutor,
  ): Promise<Patient | null> {
    const patientResult = await executor.query<PatientRow>(
      `
        SELECT ${patientColumns}
        FROM patients
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [patientId],
    );
    const patientRow = patientResult.rows[0];

    if (!patientRow) {
      return null;
    }

    const profileResult = await executor.query<PatientProfileRow>(
      `
        SELECT ${profileColumns}
        FROM patient_profiles
        WHERE patient_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [patientId],
    );
    const profileRow = profileResult.rows[0];

    if (!profileRow) {
      return null;
    }

    const membershipResult =
      await executor.query<PatientOrganizationMembershipRow>(
        `
          SELECT ${membershipColumns}
          FROM patient_organization_memberships
          WHERE patient_id = $1
            AND is_primary = true
            AND status = 'active'
            AND deleted_at IS NULL
          ORDER BY starts_at DESC
          LIMIT 1
        `,
        [patientId],
      );
    const membershipRow = membershipResult.rows[0];

    return mapPatient(
      patientRow,
      mapProfile(profileRow),
      membershipRow ? mapMembership(membershipRow) : null,
    );
  }
}
