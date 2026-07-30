import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type {
  NotificationDeliveryEvent,
  NotificationJob,
  PatientNotificationPreference,
  PatientNotificationDestination,
} from '../domain/notification.entity';
import type {
  ClaimNotificationJobsData,
  NotificationRepository,
  PrepareNotificationJobsData,
  RecordNotificationDeliveryData,
  SetNotificationPreferenceData,
  RegisterNotificationDestinationData,
} from '../domain/notification.repository';

interface DestinationRow {
  id: string; patient_id: string; organization_id: string;
  channel: PatientNotificationDestination['channel'];
  destination_reference: string; masked_label: string;
  status: PatientNotificationDestination['status'];
  verified_at: Date | null; revoked_at: Date | null; created_by: string | null;
  created_at: Date; updated_at: Date;
}

interface PreferenceRow {
  id: string;
  patient_id: string;
  organization_id: string;
  enabled_channels: unknown;
  reminder_lead_minutes: number;
  status: PatientNotificationPreference['status'];
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface JobRow {
  id: string;
  patient_id: string;
  organization_id: string;
  expected_dose_id: string;
  job_type: NotificationJob['jobType'];
  channel: NotificationJob['channel'];
  destination_id: string;
  destination_reference?: string | null;
  destination_masked_label?: string | null;
  scheduled_for: Date;
  status: NotificationJob['status'];
  claim_token: string | null;
  claimed_by: string | null;
  claimed_at: Date | null;
  lease_expires_at: Date | null;
  attempt_count: number;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapDestination(row: DestinationRow): PatientNotificationDestination {
  return {
    id: row.id, patientId: row.patient_id, organizationId: row.organization_id,
    channel: row.channel, destinationReference: row.destination_reference,
    maskedLabel: row.masked_label, status: row.status,
    verifiedAt: row.verified_at, revokedAt: row.revoked_at,
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

interface DeliveryRow {
  id: string;
  notification_job_id: string;
  provider: string;
  delivery_status: NotificationDeliveryEvent['deliveryStatus'];
  provider_message_id: string | null;
  error_code: string | null;
  detail: string | null;
  occurred_at: Date;
  recorded_at: Date;
}

function mapPreference(row: PreferenceRow): PatientNotificationPreference {
  const channels = Array.isArray(row.enabled_channels)
    ? row.enabled_channels.filter(
        (value): value is NotificationJob['channel'] =>
          value === 'push' || value === 'email' || value === 'sms',
      )
    : [];
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    enabledChannels: channels,
    reminderLeadMinutes: row.reminder_lead_minutes,
    status: row.status,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: JobRow): NotificationJob {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    expectedDoseId: row.expected_dose_id,
    jobType: row.job_type,
    channel: row.channel,
    destinationId: row.destination_id,
    destinationReference: row.destination_reference ?? null,
    destinationMaskedLabel: row.destination_masked_label ?? null,
    scheduledFor: row.scheduled_for,
    status: row.status,
    claimToken: row.claim_token,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
    leaseExpiresAt: row.lease_expires_at,
    attemptCount: row.attempt_count,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDelivery(row: DeliveryRow): NotificationDeliveryEvent {
  return {
    id: row.id,
    notificationJobId: row.notification_job_id,
    provider: row.provider,
    deliveryStatus: row.delivery_status,
    providerMessageId: row.provider_message_id,
    errorCode: row.error_code,
    detail: row.detail,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
  };
}

@Injectable()
export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async registerDestination(
    data: RegisterNotificationDestinationData,
  ): Promise<PatientNotificationDestination> {
    const result = await this.databaseService.query<DestinationRow>(
      `INSERT INTO patient_notification_destinations (
         patient_id, organization_id, channel, destination_reference, masked_label, created_by
       )
       SELECT $1, $2, $3, $4, $5, $6
       WHERE EXISTS (
         SELECT 1 FROM patient_organization_memberships
         WHERE patient_id = $1 AND organization_id = $2
           AND status = 'active' AND deleted_at IS NULL
       )
       RETURNING *`,
      [data.patientId, data.organizationId, data.channel, data.destinationReference,
       data.maskedLabel, data.createdBy ?? null],
    );
    if (!result.rows[0]) throw new Error('patient is not active in organization');
    return mapDestination(result.rows[0]);
  }

  async listDestinations(patientId: string, organizationId: string): Promise<PatientNotificationDestination[]> {
    const result = await this.databaseService.query<DestinationRow>(
      `SELECT * FROM patient_notification_destinations
       WHERE patient_id = $1 AND organization_id = $2
       ORDER BY created_at, id`,
      [patientId, organizationId],
    );
    return result.rows.map(mapDestination);
  }

  async changeDestinationStatus(
    patientId: string, organizationId: string, destinationId: string,
    status: 'verified' | 'revoked',
  ): Promise<PatientNotificationDestination> {
    return this.databaseService.transaction(async (executor) => {
      const result = await executor.query<DestinationRow>(
        `UPDATE patient_notification_destinations
         SET status = $4,
             verified_at = CASE WHEN $4 = 'verified' THEN COALESCE(verified_at, now()) ELSE verified_at END,
             revoked_at = CASE WHEN $4 = 'revoked' THEN now() ELSE NULL END,
             updated_at = now()
         WHERE id = $3 AND patient_id = $1 AND organization_id = $2
           AND status <> 'revoked'
         RETURNING *`,
        [patientId, organizationId, destinationId, status],
      );
      if (!result.rows[0]) throw new Error('active notification destination not found');
      if (status === 'revoked') {
        await executor.query(
          `UPDATE notification_jobs SET status = 'cancelled', updated_at = now()
           WHERE destination_id = $1 AND status = 'pending'`,
          [destinationId],
        );
      }
      return mapDestination(result.rows[0]);
    });
  }

  async setPreference(
    data: SetNotificationPreferenceData,
  ): Promise<PatientNotificationPreference> {
    const membership = await this.databaseService.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM patient_organization_memberships
         WHERE patient_id = $1 AND organization_id = $2
           AND status = 'active' AND deleted_at IS NULL
       ) AS exists`,
      [data.patientId, data.organizationId],
    );
    if (!membership.rows[0]?.exists) {
      throw new Error('patient is not active in organization');
    }
    return this.databaseService.transaction(async (executor) => {
      const result = await executor.query<PreferenceRow>(
        `INSERT INTO patient_notification_preferences (
           patient_id, organization_id, enabled_channels,
           reminder_lead_minutes, status, updated_by
         )
         VALUES ($1, $2, $3::jsonb, $4, $5, $6)
         ON CONFLICT (patient_id, organization_id)
         DO UPDATE SET
           enabled_channels = EXCLUDED.enabled_channels,
           reminder_lead_minutes = EXCLUDED.reminder_lead_minutes,
           status = EXCLUDED.status,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()
         RETURNING *`,
        [
          data.patientId,
          data.organizationId,
          JSON.stringify(data.enabledChannels),
          data.reminderLeadMinutes,
          data.status,
          data.updatedBy ?? null,
        ],
      );
      await executor.query(
        `UPDATE notification_jobs
         SET status = 'cancelled', updated_at = now()
         WHERE patient_id = $1 AND organization_id = $2
           AND status = 'pending'
           AND (
             $3 = 'paused'
             OR NOT (channel = ANY($4::text[]))
           )`,
        [
          data.patientId,
          data.organizationId,
          data.status,
          data.enabledChannels,
        ],
      );
      return mapPreference(result.rows[0]);
    });
  }

  async getPreference(
    patientId: string,
    organizationId: string,
  ): Promise<PatientNotificationPreference | null> {
    const result = await this.databaseService.query<PreferenceRow>(
      `SELECT * FROM patient_notification_preferences
       WHERE patient_id = $1 AND organization_id = $2
       LIMIT 1`,
      [patientId, organizationId],
    );
    return result.rows[0] ? mapPreference(result.rows[0]) : null;
  }

  async prepareJobs(
    data: PrepareNotificationJobsData,
  ): Promise<NotificationJob[]> {
    const result = await this.databaseService.query<JobRow>(
      `INSERT INTO notification_jobs (
         patient_id, organization_id, expected_dose_id,
         job_type, channel, destination_id, scheduled_for
       )
       SELECT expected.patient_id, expected.organization_id, expected.id,
              'dose_reminder', channel.value, destination.id,
              expected.scheduled_for
                - (preference.reminder_lead_minutes * interval '1 minute')
       FROM medication_expected_doses expected
       JOIN patient_notification_preferences preference
         ON preference.patient_id = expected.patient_id
        AND preference.organization_id = expected.organization_id
       CROSS JOIN LATERAL jsonb_array_elements_text(
         preference.enabled_channels
       ) AS channel(value)
       JOIN patient_notification_destinations destination
         ON destination.patient_id = expected.patient_id
        AND destination.organization_id = expected.organization_id
        AND destination.channel = channel.value
        AND destination.status = 'verified'
       WHERE expected.patient_id = $1 AND expected.organization_id = $2
         AND expected.scheduled_for >= $3 AND expected.scheduled_for <= $4
         AND expected.status = 'scheduled'
         AND preference.status = 'active'
         AND channel.value IN ('push', 'email', 'sms')
       ON CONFLICT (expected_dose_id, job_type, channel, destination_id)
         WHERE destination_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [
        data.patientId,
        data.organizationId,
        data.windowStartsAt,
        data.windowEndsAt,
      ],
    );
    return result.rows.map(mapJob);
  }

  async claimJobs(data: ClaimNotificationJobsData): Promise<NotificationJob[]> {
    return this.databaseService.transaction(async (executor) => {
      const result = await executor.query<JobRow>(
        `WITH claimable AS (
           SELECT job.id
           FROM notification_jobs job
           JOIN medication_expected_doses expected
             ON expected.id = job.expected_dose_id
           WHERE job.patient_id = $1 AND job.organization_id = $2
             AND job.scheduled_for <= $3
             AND expected.status = 'scheduled'
             AND (
               job.status = 'pending'
               OR (
                 job.status = 'processing'
                 AND job.lease_expires_at <= $3
               )
             )
           ORDER BY job.scheduled_for, job.id
           FOR UPDATE SKIP LOCKED
           LIMIT $4
         )
         UPDATE notification_jobs job
         SET status = 'processing',
             claim_token = gen_random_uuid(),
             claimed_by = $5,
             claimed_at = $3,
             lease_expires_at =
               $3 + ($6::int * interval '1 second'),
             attempt_count = job.attempt_count + 1,
             updated_at = now()
         FROM claimable
         WHERE job.id = claimable.id
         RETURNING job.*,
           (SELECT destination_reference FROM patient_notification_destinations
            WHERE id = job.destination_id) AS destination_reference,
           (SELECT masked_label FROM patient_notification_destinations
            WHERE id = job.destination_id) AS destination_masked_label`,
        [
          data.patientId,
          data.organizationId,
          data.asOf,
          data.limit,
          data.workerId,
          data.leaseSeconds,
        ],
      );
      return result.rows.map(mapJob);
    });
  }

  async recordDelivery(
    data: RecordNotificationDeliveryData,
  ): Promise<NotificationDeliveryEvent> {
    return this.databaseService.transaction(async (executor) => {
      const jobResult = await executor.query<JobRow>(
        `SELECT * FROM notification_jobs
         WHERE id = $1 AND patient_id = $2 AND organization_id = $3
         FOR UPDATE`,
        [data.notificationJobId, data.patientId, data.organizationId],
      );
      const job = jobResult.rows[0];
      if (!job) throw new Error('notification job not found');
      if (job.status !== 'processing' || job.claim_token !== data.claimToken) {
        throw new Error('notification job claim is not active');
      }

      const deliveryResult = await executor.query<DeliveryRow>(
        `INSERT INTO notification_delivery_events (
           notification_job_id, provider, delivery_status,
           provider_message_id, error_code, detail, occurred_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()))
         RETURNING *`,
        [
          job.id,
          data.provider,
          data.deliveryStatus,
          data.providerMessageId ?? null,
          data.errorCode ?? null,
          data.detail ?? null,
          data.occurredAt ?? null,
        ],
      );
      await executor.query(
        `UPDATE notification_jobs
         SET status = $2,
             last_error = CASE WHEN $2 = 'failed' THEN $3 ELSE NULL END,
             lease_expires_at = NULL,
             updated_at = now()
         WHERE id = $1`,
        [
          job.id,
          data.deliveryStatus === 'failed' ? 'failed' : 'sent',
          data.detail ?? data.errorCode ?? null,
        ],
      );
      return mapDelivery(deliveryResult.rows[0]);
    });
  }
}
