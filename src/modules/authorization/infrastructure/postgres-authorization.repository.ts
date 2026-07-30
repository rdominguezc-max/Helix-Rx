import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { AuthorizationMembership } from '../domain/authorization-membership';
import type {
  AuthorizationRepository,
  FindPatientAccessInput,
} from '../domain/authorization.repository';
import type { PatientAccessContext } from '../domain/patient-relationship';

interface AuthorizationMembershipRow {
  membership_id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  role_code: string;
  permission_codes: string[];
}

interface PatientAccessRow {
  patient_id: string;
  organization_id: string;
  related_user_id: string;
  relationship_type: PatientAccessContext['relationshipType'];
  has_active_organization_membership: boolean;
  has_active_relationship: boolean;
  has_active_consent: boolean;
}

@Injectable()
export class PostgresAuthorizationRepository
  implements AuthorizationRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

  async findActiveMembershipPermissions(
    userId: string,
    organizationId: string,
  ): Promise<AuthorizationMembership | null> {
    const result =
      await this.databaseService.query<AuthorizationMembershipRow>(
        `
          SELECT
            organization_memberships.id AS membership_id,
            organization_memberships.user_id,
            organization_memberships.organization_id,
            roles.id AS role_id,
            roles.code AS role_code,
            COALESCE(
              array_agg(permissions.code ORDER BY permissions.code)
                FILTER (WHERE permissions.code IS NOT NULL),
              ARRAY[]::text[]
            ) AS permission_codes
          FROM organization_memberships
          JOIN roles ON roles.id = organization_memberships.role_id
          LEFT JOIN role_permissions
            ON role_permissions.role_id = roles.id
            AND role_permissions.deleted_at IS NULL
          LEFT JOIN permissions
            ON permissions.id = role_permissions.permission_id
            AND permissions.deleted_at IS NULL
            AND permissions.status = 'active'
          WHERE organization_memberships.user_id = $1
            AND organization_memberships.organization_id = $2
            AND organization_memberships.status = 'active'
            AND organization_memberships.deleted_at IS NULL
            AND roles.status = 'active'
            AND roles.deleted_at IS NULL
          GROUP BY
            organization_memberships.id,
            organization_memberships.user_id,
            organization_memberships.organization_id,
            roles.id,
            roles.code
          LIMIT 1
        `,
        [userId, organizationId],
      );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      membershipId: row.membership_id,
      userId: row.user_id,
      organizationId: row.organization_id,
      roleId: row.role_id,
      roleCode: row.role_code,
      permissionCodes: row.permission_codes,
    };
  }

  async findPatientAccess(
    input: FindPatientAccessInput,
  ): Promise<PatientAccessContext | null> {
    const result = await this.databaseService.query<PatientAccessRow>(
      `
        SELECT
          patient_organization_memberships.patient_id,
          patient_organization_memberships.organization_id,
          patient_care_relationships.related_user_id,
          patient_care_relationships.relationship_type,
          true AS has_active_organization_membership,
          true AS has_active_relationship,
          EXISTS (
            SELECT 1
            FROM patient_consents
            WHERE patient_consents.patient_id = $3
              AND patient_consents.organization_id = $2
              AND patient_consents.status = 'active'
              AND patient_consents.deleted_at IS NULL
              AND patient_consents.effective_from <= now()
              AND (
                patient_consents.effective_to IS NULL
                OR patient_consents.effective_to >= now()
              )
              AND (
                patient_consents.granted_to_user_id = $1
                OR patient_consents.granted_to_organization_id = $2
                OR patient_consents.subject_user_id = $1
              )
              AND (
                cardinality($4::text[]) = 0
                OR patient_consents.scope ?| $4::text[]
              )
          ) AS has_active_consent
        FROM patient_organization_memberships
        JOIN patient_care_relationships
          ON patient_care_relationships.patient_id =
            patient_organization_memberships.patient_id
          AND patient_care_relationships.organization_id =
            patient_organization_memberships.organization_id
          AND patient_care_relationships.related_user_id = $1
          AND patient_care_relationships.status = 'active'
          AND patient_care_relationships.deleted_at IS NULL
          AND patient_care_relationships.starts_at <= now()
          AND (
            patient_care_relationships.ends_at IS NULL
            OR patient_care_relationships.ends_at >= now()
          )
        WHERE patient_organization_memberships.patient_id = $3
          AND patient_organization_memberships.organization_id = $2
          AND patient_organization_memberships.status = 'active'
          AND patient_organization_memberships.deleted_at IS NULL
          AND patient_organization_memberships.starts_at <= now()
          AND (
            patient_organization_memberships.ends_at IS NULL
            OR patient_organization_memberships.ends_at >= now()
          )
        ORDER BY
          CASE patient_care_relationships.relationship_type
            WHEN 'self' THEN 1
            WHEN 'primary_physician' THEN 2
            WHEN 'treating_physician' THEN 3
            ELSE 10
          END
        LIMIT 1
      `,
      [
        input.userId,
        input.organizationId,
        input.patientId,
        input.consentScopes,
      ],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      patientId: row.patient_id,
      organizationId: row.organization_id,
      relatedUserId: row.related_user_id,
      relationshipType: row.relationship_type,
      hasActiveOrganizationMembership: row.has_active_organization_membership,
      hasActiveRelationship: row.has_active_relationship,
      hasActiveConsent: row.has_active_consent,
    };
  }
}
