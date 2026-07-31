import { Pool } from 'pg';

const ids = {
  organization: '10000000-0000-4000-8000-000000000001',
  user: '20000000-0000-4000-8000-000000000001',
  patient: '30000000-0000-4000-8000-000000000001',
  medication: '40000000-0000-4000-8000-000000000001',
  presentation: '50000000-0000-4000-8000-000000000001',
  treatment: '60000000-0000-4000-8000-000000000001',
  inventoryLot: '70000000-0000-4000-8000-000000000001',
};

async function main(): Promise<void> {
  const pool = new Pool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USER ?? 'helix',
    password: process.env.DATABASE_PASSWORD ?? 'helix_dev_password',
    database: process.env.DATABASE_NAME ?? 'helix_dev',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO organizations (id, name, slug)
       VALUES ($1, 'Helix MVP Demo', 'helix-mvp-demo')
       ON CONFLICT DO NOTHING`,
      [ids.organization],
    );
    await client.query(
      `INSERT INTO users (
         id, first_name, last_name, email, language, timezone, status
       )
       VALUES ($1, 'Roberto', 'Muestra', 'mvp.patient@helix.local',
               'es', 'America/Hermosillo', 'active')
       ON CONFLICT DO NOTHING`,
      [ids.user],
    );
    await client.query(
      `INSERT INTO organization_memberships (
         organization_id, user_id, relationship, status, role_id
       )
       SELECT $1, $2, 'member', 'active', roles.id
       FROM roles WHERE roles.code = 'patient'
       ON CONFLICT DO NOTHING`,
      [ids.organization, ids.user],
    );
    await client.query(
      `INSERT INTO patients (id, user_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT DO NOTHING`,
      [ids.patient, ids.user],
    );
    await client.query(
      `INSERT INTO patient_profiles (
         patient_id, first_name, last_name, email, timezone
       )
       VALUES ($1, 'Roberto', 'Muestra', 'mvp.patient@helix.local',
               'America/Hermosillo')
       ON CONFLICT DO NOTHING`,
      [ids.patient],
    );
    await client.query(
      `INSERT INTO patient_organization_memberships (
         patient_id, organization_id, status, membership_type, is_primary
       )
       VALUES ($1, $2, 'active', 'primary', true)
       ON CONFLICT DO NOTHING`,
      [ids.patient, ids.organization],
    );
    await client.query(
      `INSERT INTO patient_care_relationships (
         patient_id, organization_id, related_user_id, relationship_type,
         status, access_scope, created_by
       )
       VALUES (
         $1, $2, $3, 'self', 'active',
         '["profile.read","medications.read","adherence.write"]'::jsonb, $3
       )
       ON CONFLICT DO NOTHING`,
      [ids.patient, ids.organization, ids.user],
    );
    await client.query(
      `INSERT INTO medications (
         id, organization_id, generic_name, active_ingredient,
         medication_form, route
       )
       VALUES ($1, $2, 'Levetiracetam', 'Levetiracetam', 'tablet', 'oral')
       ON CONFLICT DO NOTHING`,
      [ids.medication, ids.organization],
    );
    await client.query(
      `INSERT INTO medication_presentations (
         id, medication_id, brand_name, strength_amount, strength_unit,
         administration_unit, package_quantity, country_code
       )
       VALUES ($1, $2, 'Helix Demo', 500, 'mg', 'tablet', 30, 'MX')
       ON CONFLICT DO NOTHING`,
      [ids.presentation, ids.medication],
    );
    await client.query(
      `INSERT INTO patient_treatments (
         id, patient_id, organization_id, medication_id, dose_amount,
         dose_unit, frequency_interval_hours, administration_times,
         instructions, starts_on, is_as_needed, status, created_by
       )
       VALUES (
         $1, $2, $3, $4, 500, 'mg', 12, '["09:00","21:00"]'::jsonb,
         'Tomar una tableta cada 12 horas', current_date - 30, false,
         'active', $5
       )
       ON CONFLICT DO NOTHING`,
      [ids.treatment, ids.patient, ids.organization, ids.medication, ids.user],
    );
    await client.query(
      `INSERT INTO patient_medication_inventory_lots (
         id, patient_id, organization_id, presentation_id, lot_number,
         quantity_acquired, quantity_remaining, expires_on, status, created_by
       )
       VALUES ($1, $2, $3, $4, 'MVP-DEMO', 30, 12,
               current_date + 180, 'active', $5)
       ON CONFLICT DO NOTHING`,
      [
        ids.inventoryLot,
        ids.patient,
        ids.organization,
        ids.presentation,
        ids.user,
      ],
    );
    await client.query(
      `INSERT INTO medication_expected_doses (
         patient_treatment_id, patient_id, organization_id,
         scheduled_for, timezone
       )
       SELECT $1, $2, $3,
              (
                date_trunc('day', now() AT TIME ZONE 'America/Hermosillo')
                - (day_offset || ' days')::interval
                + administration_time
              ) AT TIME ZONE 'America/Hermosillo',
              'America/Hermosillo'
       FROM generate_series(0, 14) AS series(day_offset)
       CROSS JOIN (
         VALUES (interval '9 hours'), (interval '21 hours')
       ) AS schedule(administration_time)
       ON CONFLICT DO NOTHING`,
      [ids.treatment, ids.patient, ids.organization],
    );
    await client.query(
      `INSERT INTO medication_dose_events (
         patient_treatment_id, patient_id, organization_id, scheduled_for,
         event_status, occurred_at, timing_status, prescribed_dose_amount,
         prescribed_dose_unit, idempotency_key, recorded_by
       )
       SELECT $1, $2, $3, expected.scheduled_for, 'confirmed',
              expected.scheduled_for + interval '5 minutes', 'on_time',
              500, 'mg', 'mvp-seed-' || expected.id, $4
       FROM medication_expected_doses expected
       WHERE expected.patient_treatment_id = $1
         AND expected.scheduled_for < now()
         AND mod(extract(day FROM expected.scheduled_for)::int, 10) <> 0
       ON CONFLICT DO NOTHING`,
      [ids.treatment, ids.patient, ids.organization, ids.user],
    );
    await client.query(
      `UPDATE medication_expected_doses expected
       SET status = 'fulfilled',
           medication_dose_event_id = event.id,
           updated_at = now()
       FROM medication_dose_events event
       WHERE expected.patient_treatment_id = $1
         AND event.patient_treatment_id = expected.patient_treatment_id
         AND event.scheduled_for = expected.scheduled_for
         AND expected.medication_dose_event_id IS NULL`,
      [ids.treatment],
    );
    await client.query('COMMIT');
    console.log(JSON.stringify(ids, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
