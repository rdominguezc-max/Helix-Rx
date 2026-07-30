import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    process.env[key] ??= value;
  }
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const pool = new Pool({
    host: requireEnv('DATABASE_HOST', 'localhost'),
    port: Number(requireEnv('DATABASE_PORT', '5432')),
    user: requireEnv('DATABASE_USER', 'helix'),
    password: requireEnv('DATABASE_PASSWORD', 'helix_dev_password'),
    database: requireEnv('DATABASE_NAME', 'helix_dev'),
    ssl: requireEnv('DATABASE_SSL', 'false') === 'true',
  });

  const migrationsDirectory = join(process.cwd(), 'database', 'migrations');
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  for (const filename of migrationFiles) {
    const existingMigration = await pool.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [filename],
    );

    if (existingMigration.rowCount && existingMigration.rowCount > 0) {
      continue;
    }

    const sql = readFileSync(join(migrationsDirectory, filename), 'utf8');

    await pool.query('BEGIN');

    try {
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename],
      );
      await pool.query('COMMIT');
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  await pool.end();
}

void main();
