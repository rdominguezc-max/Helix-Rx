import { existsSync, readFileSync } from 'node:fs';
import { Pool, type PoolClient } from 'pg';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    process.env[trimmed.slice(0, separator).trim()] ??=
      trimmed.slice(separator + 1).trim();
  }
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireUuid(name: string): string {
  const value = requireEnv(name);
  if (!uuidPattern.test(value)) throw new Error(`${name} must be a valid UUID`);
  return value;
}

function parseScopes(value: string): string[] {
  const scopes = [
    ...new Set(value.split(',').map((item) => item.trim()).filter(Boolean)),
  ];
  if (scopes.length === 0 || scopes.some((scope) => scope.length > 80)) {
    throw new Error(
      'BOOTSTRAP_CONSENT_SCOPES must contain valid comma-separated scopes',
    );
  }
  return scopes;
}

async function assertSingleRow(
  client: PoolClient,
  sql: string,
  values: string[],
  message: string,
): Promise<void> {
  const result = await client.query(sql, values);
  if (result.rowCount !== 1) throw new Error(message);
}

async function main(): Promise<void> {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const apply = process.argv.includes('--apply');
  const organizationId = requireUuid('BOOTSTRAP_ORGANIZATION_ID');
  const patientId = requireUuid('BOOTSTRAP_PATIENT_ID');
  const userId = requireUuid('BOOTSTRAP_USER_ID');
  const relationshipType = requireEnv(
    'BOOTSTRAP_RELATIONSHIP_TYPE',
    'organization_admin_viewer',
  );
  const consentType = requireEnv(
    'BOOTSTRAP_CONSENT_TYPE',
    'patient_data_access',
  );
  const scopes = parseScopes(
    requireEnv('BOOTSTRAP_CONSENT_SCOPES', 'patients.read,patients.write'),
  );

  const pool = new Pool({
    host: requireEnv('DATABASE_HOST', 'localhost'),
    port: Number(requireEnv('DATABASE_PORT', '5432')),
    user: requireEnv('DATABASE_USER', 'helix'),
    password: requireEnv('DATABASE_PASSWORD', 'helix_dev_password'),
    database: requireEnv('DATABASE_NAME', 'helix_dev'),
    ssl: requireEnv('DATABASE_SSL', 'false') === 'true',
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await assertSingleRow(
      client,
      `SELECT id FROM organizations
       WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [organizationId],
      'active organization not found',
    );
    await assertSingleRow(
      client,
      `SELECT id FROM users
       WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [userId],
      'active user not found',
    );
    await assertSingleRow(
      client,
      `SELECT id FROM organization_memberships
       WHERE organization_id = $1 AND user_id = $2
         AND status = 'active' AND deleted_at IS NULL`,
      [organizationId, userId],
      'user is not an active member of the organization',
    );
    await assertSingleRow(
      client,
      `SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL`,
      [patientId],
      'patient not found',
    );
    await assertSingleRow(
      client,
      `SELECT id FROM patient_organization_memberships
       WHERE patient_id = $1 AND organization_id = $2
         AND status = 'active' AND deleted_at IS NULL`,
      [patientId, organizationId],
      'patient is not active in the organization',
    );

    const relationship = await client.query<{ id: string }>(
      `INSERT INTO patient_care_relationships (
         patient_id, organization_id, related_user_id, relationship_type,
         status, access_scope, created_by
       )
       VALUES ($1, $2, $3, $4, 'active', $5::jsonb, $3)
       ON CONFLICT (
         patient_id, organization_id, related_user_id, relationship_type
       ) WHERE status = 'active' AND deleted_at IS NULL
       DO UPDATE SET access_scope = EXCLUDED.access_scope, updated_at = now()
       RETURNING id`,
      [
        patientId,
        organizationId,
        userId,
        relationshipType,
        JSON.stringify(scopes),
      ],
    );

    const existingConsent = await client.query<{ id: string }>(
      `SELECT id FROM patient_consents
       WHERE patient_id = $1 AND organization_id = $2
         AND granted_to_user_id = $3 AND consent_type = $4
         AND status = 'active' AND effective_from <= now()
         AND (effective_to IS NULL OR effective_to >= now())
         AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [patientId, organizationId, userId, consentType],
    );
    let consentId = existingConsent.rows[0]?.id;

    if (consentId) {
      const result = await client.query<{ id: string }>(
        `UPDATE patient_consents
         SET scope = $2::jsonb, updated_at = now()
         WHERE id = $1 RETURNING id`,
        [consentId, JSON.stringify(scopes)],
      );
      consentId = result.rows[0].id;
    } else {
      const result = await client.query<{ id: string }>(
        `INSERT INTO patient_consents (
           patient_id, organization_id, granted_to_user_id, consent_type,
           scope, status, captured_by, source
         )
         VALUES ($1, $2, $3, $4, $5::jsonb, 'active', $3, 'internal_bootstrap')
         RETURNING id`,
        [
          patientId,
          organizationId,
          userId,
          consentType,
          JSON.stringify(scopes),
        ],
      );
      consentId = result.rows[0].id;
    }

    await client.query(apply ? 'COMMIT' : 'ROLLBACK');

    console.log(
      JSON.stringify(
        {
          mode: apply ? 'applied' : 'preview',
          organizationId,
          patientId,
          userId,
          relationshipId: relationship.rows[0].id,
          consentId,
          scopes,
        },
        null,
        2,
      ),
    );
    if (!apply) {
      console.log('No changes were saved. Re-run with --apply to commit.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
