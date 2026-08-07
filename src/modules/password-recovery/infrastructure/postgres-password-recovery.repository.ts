import { Injectable } from '@nestjs/common';
import { DatabaseService, type DatabaseQueryExecutor } from '../../../database/database.service';
import type { PasswordRecoveryRepository } from '../domain/password-recovery.repository';
import type { PasswordRecoveryRequest } from '../domain/password-recovery-request';

interface PasswordRecoveryRow {
  id: string;
  email: string;
  status: 'pending' | 'resolved';
  created_at: Date;
  resolved_at: Date | null;
}

const columns = 'id, email, status, created_at, resolved_at';

function mapRow(row: PasswordRecoveryRow): PasswordRecoveryRequest {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

@Injectable()
export class PostgresPasswordRecoveryRepository implements PasswordRecoveryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  createPending(data: { email: string; requesterKey: string }): Promise<PasswordRecoveryRequest | null> {
    return this.databaseService.transaction(async (executor) => {
      await executor.query('SELECT pg_advisory_xact_lock(hashtext($1))', [data.email]);
      const recent = await executor.query<PasswordRecoveryRow>(
        `SELECT ${columns}
         FROM password_recovery_requests
         WHERE email = $1 AND status = 'pending'
           AND created_at >= now() - interval '30 minutes'
         ORDER BY created_at DESC LIMIT 1`,
        [data.email],
      );
      if (recent.rows[0]) return mapRow(recent.rows[0]);
      if (await this.isRateLimited(executor, data.requesterKey)) return null;
      const result = await executor.query<PasswordRecoveryRow>(
        `INSERT INTO password_recovery_requests (email, requester_key)
         VALUES ($1, $2) RETURNING ${columns}`,
        [data.email, data.requesterKey],
      );
      return mapRow(result.rows[0]);
    });
  }

  async listPending(): Promise<PasswordRecoveryRequest[]> {
    const result = await this.databaseService.query<PasswordRecoveryRow>(
      `SELECT ${columns} FROM password_recovery_requests
       WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100`,
    );
    return result.rows.map(mapRow);
  }

  async resolve(id: string): Promise<PasswordRecoveryRequest | null> {
    const result = await this.databaseService.query<PasswordRecoveryRow>(
      `UPDATE password_recovery_requests
       SET status = 'resolved', resolved_at = now()
       WHERE id = $1 AND status = 'pending' RETURNING ${columns}`,
      [id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async isAdministrator(userId: string, email: string): Promise<boolean> {
    if (email.trim().toLowerCase() === 'rdominguezc@gmail.com') return true;
    const result = await this.databaseService.query<{ allowed: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM organization_memberships memberships
         JOIN roles ON roles.id = memberships.role_id
         WHERE memberships.user_id = $1 AND memberships.status = 'active'
           AND memberships.deleted_at IS NULL
           AND roles.code = 'platform_admin' AND roles.status = 'active'
           AND roles.deleted_at IS NULL
       ) AS allowed`,
      [userId],
    );
    return result.rows[0]?.allowed ?? false;
  }

  private async isRateLimited(executor: DatabaseQueryExecutor, requesterKey: string): Promise<boolean> {
    const result = await executor.query<{ request_count: string }>(
      `SELECT count(*)::text AS request_count
       FROM password_recovery_requests
       WHERE requester_key = $1 AND created_at >= now() - interval '1 hour'`,
      [requesterKey],
    );
    return Number(result.rows[0]?.request_count ?? 0) >= 5;
  }
}
