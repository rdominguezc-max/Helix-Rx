import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { OrganizationMembership } from '../domain/membership.entity';
import type {
  CreateMembershipData,
  MembershipRepository,
} from '../domain/membership.repository';

interface MembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  relationship: OrganizationMembership['relationship'];
  status: OrganizationMembership['status'];
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function mapMembership(row: MembershipRow): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    roleId: row.role_id,
    relationship: row.relationship,
    status: row.status,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

@Injectable()
export class PostgresMembershipRepository implements MembershipRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreateMembershipData): Promise<OrganizationMembership> {
    const result = await this.databaseService.query<MembershipRow>(
      `
        INSERT INTO organization_memberships (
          organization_id,
          user_id,
          role_id,
          relationship
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          organization_id,
          user_id,
          role_id,
          relationship,
          status,
          joined_at,
          created_at,
          updated_at,
          deleted_at
      `,
      [data.organizationId, data.userId, data.roleId, data.relationship],
    );

    return mapMembership(result.rows[0]);
  }

  async findActiveByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership | null> {
    const result = await this.databaseService.query<MembershipRow>(
      `
        SELECT
          id,
          organization_id,
          user_id,
          role_id,
          relationship,
          status,
          joined_at,
          created_at,
          updated_at,
          deleted_at
        FROM organization_memberships
        WHERE organization_id = $1
          AND user_id = $2
          AND status = 'active'
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [organizationId, userId],
    );

    const row = result.rows[0];

    return row ? mapMembership(row) : null;
  }
}
