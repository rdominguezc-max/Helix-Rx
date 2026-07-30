import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type { AuditLog, AuditMetadata } from '../domain/audit-log.entity';
import type {
  AuditLogRepository,
  RecordAuditLogData,
} from '../domain/audit-log.repository';

interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  organization_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: AuditLog['result'];
  ip_address: string | null;
  user_agent: string | null;
  metadata: AuditMetadata;
  created_at: Date;
}

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    organizationId: row.organization_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    result: row.result,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

@Injectable()
export class PostgresAuditLogRepository implements AuditLogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async record(data: RecordAuditLogData): Promise<AuditLog> {
    const result = await this.databaseService.query<AuditLogRow>(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          organization_id,
          action,
          resource_type,
          resource_id,
          result,
          ip_address,
          user_agent,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9::jsonb)
        RETURNING
          id,
          actor_user_id,
          organization_id,
          action,
          resource_type,
          resource_id,
          result,
          ip_address::text,
          user_agent,
          metadata,
          created_at
      `,
      [
        data.actorUserId ?? null,
        data.organizationId ?? null,
        data.action,
        data.resourceType,
        data.resourceId ?? null,
        data.result,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        JSON.stringify(data.metadata ?? {}),
      ],
    );

    return mapAuditLog(result.rows[0]);
  }
}
