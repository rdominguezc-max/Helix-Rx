import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { Permission } from '../../permissions/domain/permission.entity';
import type { RolePermission } from '../domain/role-permission.entity';
import type { Role } from '../domain/role.entity';
import type {
  CreateRoleData,
  RoleRepository,
} from '../domain/role.repository';

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string;
  status: Role['status'];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface RolePermissionRow {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: Date;
  deleted_at: Date | null;
}

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

const roleSelectColumns = `
  id,
  code,
  name,
  description,
  status,
  created_at,
  updated_at,
  deleted_at
`;

const permissionSelectColumns = `
  permissions.id,
  permissions.code,
  permissions.description,
  permissions.resource,
  permissions.action,
  permissions.status,
  permissions.created_at,
  permissions.updated_at,
  permissions.deleted_at
`;

function mapRole(row: RoleRow): Role {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapRolePermission(row: RolePermissionRow): RolePermission {
  return {
    id: row.id,
    roleId: row.role_id,
    permissionId: row.permission_id,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

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
export class PostgresRoleRepository implements RoleRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreateRoleData): Promise<Role> {
    const result = await this.databaseService.query<RoleRow>(
      `
        INSERT INTO roles (code, name, description, status)
        VALUES ($1, $2, $3, $4)
        RETURNING ${roleSelectColumns}
      `,
      [data.code, data.name, data.description, data.status],
    );

    return mapRole(result.rows[0]);
  }

  async findById(id: string): Promise<Role | null> {
    const result = await this.databaseService.query<RoleRow>(
      `
        SELECT ${roleSelectColumns}
        FROM roles
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    const row = result.rows[0];

    return row ? mapRole(row) : null;
  }

  async findByCode(code: string): Promise<Role | null> {
    const result = await this.databaseService.query<RoleRow>(
      `
        SELECT ${roleSelectColumns}
        FROM roles
        WHERE code = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [code],
    );

    const row = result.rows[0];

    return row ? mapRole(row) : null;
  }

  async assignPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission> {
    const result = await this.databaseService.query<RolePermissionRow>(
      `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        RETURNING id, role_id, permission_id, created_at, deleted_at
      `,
      [roleId, permissionId],
    );

    return mapRolePermission(result.rows[0]);
  }

  async findRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission | null> {
    const result = await this.databaseService.query<RolePermissionRow>(
      `
        SELECT id, role_id, permission_id, created_at, deleted_at
        FROM role_permissions
        WHERE role_id = $1
          AND permission_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [roleId, permissionId],
    );

    const row = result.rows[0];

    return row ? mapRolePermission(row) : null;
  }

  async listPermissionsByRole(roleId: string): Promise<Permission[]> {
    const result = await this.databaseService.query<PermissionRow>(
      `
        SELECT ${permissionSelectColumns}
        FROM role_permissions
        JOIN permissions ON permissions.id = role_permissions.permission_id
        WHERE role_permissions.role_id = $1
          AND role_permissions.deleted_at IS NULL
          AND permissions.deleted_at IS NULL
          AND permissions.status = 'active'
        ORDER BY permissions.resource ASC, permissions.action ASC
      `,
      [roleId],
    );

    return result.rows.map(mapPermission);
  }
}
