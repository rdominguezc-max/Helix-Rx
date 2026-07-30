import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service';
import { PostgresNotificationRepository } from '../src/modules/medications/infrastructure/postgres-notification.repository';

async function main(): Promise<void> {
  const pool = new Pool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USER ?? 'helix',
    password: process.env.DATABASE_PASSWORD ?? 'helix_dev_password',
    database: process.env.DATABASE_NAME ?? 'helix_dev',
  });
  const repository = new PostgresNotificationRepository(
    new DatabaseService(pool),
  );
  const organizationId = randomUUID();
  const patientId = randomUUID();
  const medicationId = randomUUID();
  const treatmentId = randomUUID();
  const expectedDoseId = randomUUID();
  const expectedAt = new Date('2026-07-30T16:00:00.000Z');

  try {
    await pool.query(
      `INSERT INTO organizations (id, name, slug)
       VALUES ($1, 'Notification Validation', $2)`,
      [organizationId, `notification-${organizationId}`],
    );
    await pool.query(
      `INSERT INTO patients (id, status) VALUES ($1, 'active')`,
      [patientId],
    );
    await pool.query(
      `INSERT INTO patient_organization_memberships (
         patient_id, organization_id, status
       )
       VALUES ($1, $2, 'active')`,
      [patientId, organizationId],
    );
    await pool.query(
      `INSERT INTO medications (
         id, organization_id, generic_name, active_ingredient,
         medication_form, route
       )
       VALUES ($1, $2, 'Notification Medication',
               'Notification Ingredient', 'tablet', 'oral')`,
      [medicationId, organizationId],
    );
    await pool.query(
      `INSERT INTO patient_treatments (
         id, patient_id, organization_id, medication_id,
         dose_amount, dose_unit, administration_times,
         starts_on, is_as_needed, status
       )
       VALUES ($1, $2, $3, $4, 1000, 'mg', '["09:00"]'::jsonb,
               '2026-07-30', false, 'active')`,
      [treatmentId, patientId, organizationId, medicationId],
    );
    await pool.query(
      `INSERT INTO medication_expected_doses (
         id, patient_treatment_id, patient_id, organization_id,
         scheduled_for, timezone
       )
       VALUES ($1, $2, $3, $4, $5, 'America/Hermosillo')`,
      [
        expectedDoseId,
        treatmentId,
        patientId,
        organizationId,
        expectedAt,
      ],
    );

    await repository.setPreference({
      patientId,
      organizationId,
      enabledChannels: ['push', 'email'],
      reminderLeadMinutes: 15,
      status: 'active',
    });
    const pushDestination = await repository.registerDestination({
      patientId, organizationId, channel: 'push',
      destinationReference: `push-${patientId}`, maskedLabel: 'device …test',
    });
    await repository.changeDestinationStatus(
      patientId, organizationId, pushDestination.id, 'verified',
    );
    const emailDestination = await repository.registerDestination({
      patientId, organizationId, channel: 'email',
      destinationReference: `email-${patientId}`, maskedLabel: 'r***@example.test',
    });
    await repository.changeDestinationStatus(
      patientId, organizationId, emailDestination.id, 'verified',
    );
    const prepared = await repository.prepareJobs({
      patientId,
      organizationId,
      windowStartsAt: new Date('2026-07-30T00:00:00.000Z'),
      windowEndsAt: new Date('2026-07-31T00:00:00.000Z'),
    });
    if (prepared.length !== 2) {
      throw new Error(`expected 2 notification jobs, received ${prepared.length}`);
    }
    const duplicate = await repository.prepareJobs({
      patientId,
      organizationId,
      windowStartsAt: new Date('2026-07-30T00:00:00.000Z'),
      windowEndsAt: new Date('2026-07-31T00:00:00.000Z'),
    });
    if (duplicate.length !== 0) {
      throw new Error('notification job preparation is not idempotent');
    }

    const claimed = await repository.claimJobs({
      patientId,
      organizationId,
      workerId: 'runtime-worker',
      asOf: new Date('2026-07-30T16:00:00.000Z'),
      limit: 1,
      leaseSeconds: 300,
    });
    if (
      claimed.length !== 1 ||
      claimed[0].status !== 'processing' ||
      !claimed[0].claimToken
    ) {
      throw new Error('notification job was not claimed');
    }
    const delivery = await repository.recordDelivery({
      patientId,
      organizationId,
      notificationJobId: claimed[0].id,
      claimToken: claimed[0].claimToken,
      provider: 'runtime-provider',
      deliveryStatus: 'accepted',
      providerMessageId: randomUUID(),
    });
    if (delivery.deliveryStatus !== 'accepted') {
      throw new Error('notification delivery was not recorded');
    }

    let staleClaimRejected = false;
    try {
      await repository.recordDelivery({
        patientId,
        organizationId,
        notificationJobId: claimed[0].id,
        claimToken: claimed[0].claimToken,
        provider: 'runtime-provider',
        deliveryStatus: 'accepted',
      });
    } catch {
      staleClaimRejected = true;
    }
    if (!staleClaimRejected) {
      throw new Error('stale notification claim was accepted');
    }
    console.log(
      'Notification runtime validation passed: preferences, idempotency, claim lease, delivery and stale-token rejection.',
    );
  } finally {
    await pool.query(
      `DELETE FROM notification_delivery_events
       WHERE notification_job_id IN (
         SELECT id FROM notification_jobs WHERE patient_id = $1
       )`,
      [patientId],
    );
    await pool.query('DELETE FROM notification_jobs WHERE patient_id = $1', [
      patientId,
    ]);
    await pool.query(
      'DELETE FROM patient_notification_preferences WHERE patient_id = $1',
      [patientId],
    );
    await pool.query(
      'DELETE FROM patient_notification_destinations WHERE patient_id = $1',
      [patientId],
    );
    await pool.query(
      'DELETE FROM medication_expected_doses WHERE patient_id = $1',
      [patientId],
    );
    await pool.query('DELETE FROM patient_treatments WHERE id = $1', [
      treatmentId,
    ]);
    await pool.query('DELETE FROM medications WHERE id = $1', [medicationId]);
    await pool.query(
      'DELETE FROM patient_organization_memberships WHERE patient_id = $1',
      [patientId],
    );
    await pool.query('DELETE FROM patients WHERE id = $1', [patientId]);
    await pool.query('DELETE FROM organizations WHERE id = $1', [
      organizationId,
    ]);
    await pool.end();
  }
}

void main();
