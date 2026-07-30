import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service';
import { PostgresExpectedDoseRepository } from '../src/modules/medications/infrastructure/postgres-expected-dose.repository';

async function main(): Promise<void> {
  const pool = new Pool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USER ?? 'helix',
    password: process.env.DATABASE_PASSWORD ?? 'helix_dev_password',
    database: process.env.DATABASE_NAME ?? 'helix_dev',
  });
  const database = new DatabaseService(pool);
  const repository = new PostgresExpectedDoseRepository(database);
  const organizationId = randomUUID();
  const patientId = randomUUID();
  const medicationId = randomUUID();
  const treatmentId = randomUUID();
  const eventId = randomUUID();
  const windowStartsAt = new Date('2026-07-30T00:00:00.000Z');
  const windowEndsAt = new Date('2026-08-01T23:59:59.999Z');
  const common = {
    patientId,
    organizationId,
    treatmentId,
    windowStartsAt,
    windowEndsAt,
    asOf: new Date('2026-08-02T12:00:00.000Z'),
    missedGraceMinutes: 60,
  };

  try {
    await pool.query(
      `INSERT INTO organizations (id, name, slug)
       VALUES ($1, 'Expected Dose Validation', $2)`,
      [organizationId, `expected-dose-${organizationId}`],
    );
    await pool.query(
      `INSERT INTO patients (id, status) VALUES ($1, 'active')`,
      [patientId],
    );
    await pool.query(
      `INSERT INTO patient_profiles (
         patient_id, first_name, last_name, timezone
       )
       VALUES ($1, 'Runtime', 'Validation', 'America/Hermosillo')`,
      [patientId],
    );
    await pool.query(
      `INSERT INTO medications (
         id, organization_id, generic_name, active_ingredient,
         medication_form, route
       )
       VALUES ($1, $2, 'Validation Medication', 'Validation Ingredient',
               'tablet', 'oral')`,
      [medicationId, organizationId],
    );
    await pool.query(
      `INSERT INTO patient_treatments (
         id, patient_id, organization_id, medication_id,
         dose_amount, dose_unit, administration_times,
         starts_on, is_as_needed, status
       )
       VALUES ($1, $2, $3, $4, 1000, 'mg', '["07:00","19:00"]'::jsonb,
               '2026-07-30', false, 'active')`,
      [treatmentId, patientId, organizationId, medicationId],
    );

    const first = await repository.generate(common);
    if (first.generatedCount !== 5 || first.expectedDoses.length !== 5) {
      throw new Error(
        `expected 5 generated doses, received ${first.generatedCount}/${first.expectedDoses.length}`,
      );
    }
    if (
      first.expectedDoses[0].scheduledFor.toISOString() !==
      '2026-07-30T14:00:00.000Z'
    ) {
      throw new Error('patient timezone was not applied to 07:00');
    }
    const second = await repository.generate(common);
    if (second.generatedCount !== 0 || second.expectedDoses.length !== 5) {
      throw new Error('expected dose generation is not idempotent');
    }

    await pool.query(
      `INSERT INTO medication_dose_events (
         id, patient_treatment_id, patient_id, organization_id,
         scheduled_for, event_status, occurred_at, timing_status,
         prescribed_dose_amount, prescribed_dose_unit,
         idempotency_key
       )
       VALUES ($1, $2, $3, $4, '2026-07-30T14:00:00.000Z',
               'confirmed', '2026-07-30T14:00:00.000Z', 'on_time',
               1000, 'mg', $5)`,
      [eventId, treatmentId, patientId, organizationId, randomUUID()],
    );
    const linked = await repository.generate(common);
    if (
      linked.expectedDoses[0].status !== 'fulfilled' ||
      linked.expectedDoses[0].medicationDoseEventId !== eventId
    ) {
      throw new Error('existing dose event was not linked');
    }
    if (linked.expectedDoses.slice(1).some((dose) => dose.status !== 'missed')) {
      throw new Error('overdue expected doses were not classified as missed');
    }
    console.log(
      'Expected dose runtime validation passed: timezone, idempotency, linking and missed classification.',
    );
  } finally {
    await pool.query(
      `DELETE FROM medication_expected_doses
       WHERE patient_treatment_id = $1`,
      [treatmentId],
    );
    await pool.query(
      `DELETE FROM medication_dose_events
       WHERE patient_treatment_id = $1`,
      [treatmentId],
    );
    await pool.query('DELETE FROM patient_treatments WHERE id = $1', [
      treatmentId,
    ]);
    await pool.query('DELETE FROM medications WHERE id = $1', [medicationId]);
    await pool.query('DELETE FROM patient_profiles WHERE patient_id = $1', [
      patientId,
    ]);
    await pool.query('DELETE FROM patients WHERE id = $1', [patientId]);
    await pool.query('DELETE FROM organizations WHERE id = $1', [
      organizationId,
    ]);
    await pool.end();
  }
}

void main();
