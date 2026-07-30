import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { Permission } from '../domain/permission.entity';
import type {
  CreatePermissionData,
  PermissionRepository,
} from '../domain/permission.repository';

interface PermissionRow {
  id: string;
  code: string;
  description: string;
  resource: string;
  action: string;
  status: Permission['status'];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const permissionSelectColumns = `
  id,
  code,
  description,
  resource,
  action,
  status,
  created_at,
  updated_at,
  deleted_at
`;

function mapPermission(row: PermissionRow): Permission {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    resource: row.resource,
    action: row.action,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

@Injectable()
export class PostgresPermissionRepository implements PermissionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreatePermissionData): Promise<Permission> {
    const result = await this.databaseService.query<PermissionRow>(
      `
        INSERT INTO permissions (code, description, resource, action)
        VALUES ($1, $2, $3, $4)
        RETURNING ${permissionSelectColumns}
      `,
      [data.code, data.description, data.resource, data.action],
    );

    return mapPermission(result.rows[0]);
  }

  async findByCode(code: string): Promise<Permission | null> {
    const result = await this.databaseService.query<PermissionRow>(
      `
        SELECT ${permissionSelectColumns}
        FROM permissions
        WHERE code = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [code],
    );

    const row = result.rows[0];

    return row ? mapPermission(row) : null;
  }

  async listActive(): Promise<Permission[]> {
    const result = await this.databaseService.query<PermissionRow>(
      `
        SELECT ${permissionSelectColumns}
        FROM permissions
        WHERE status = 'active'
          AND deleted_at IS NULL
        ORDER BY resource ASC, action ASC
      `,
    );

    return result.rows.map(mapPermission);
  }
}
