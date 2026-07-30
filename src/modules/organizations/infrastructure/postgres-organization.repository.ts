import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { Organization } from '../domain/organization.entity';
import type {
  CreateOrganizationData,
  OrganizationRepository,
} from '../domain/organization.repository';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: Organization['status'];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

@Injectable()
export class PostgresOrganizationRepository implements OrganizationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreateOrganizationData): Promise<Organization> {
    const result = await this.databaseService.query<OrganizationRow>(
      `
        INSERT INTO organizations (name, slug)
        VALUES ($1, $2)
        RETURNING id, name, slug, status, created_at, updated_at, deleted_at
      `,
      [data.name, data.slug],
    );

    return mapOrganization(result.rows[0]);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.databaseService.query<OrganizationRow>(
      `
        SELECT id, name, slug, status, created_at, updated_at, deleted_at
        FROM organizations
        WHERE slug = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [slug],
    );

    const row = result.rows[0];

    return row ? mapOrganization(row) : null;
  }
}
