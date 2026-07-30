import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type {
  NotificationDeliveryEvent,
  NotificationJob,
  PatientNotificationPreference,
} from '../domain/notification.entity';
import type {
  ClaimNotificationJobsData,
  NotificationRepository,
  PrepareNotificationJobsData,
  RecordNotificationDeliveryData,
  SetNotificationPreferenceData,
} from '../domain/notification.repository';

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
         job_type, channel, scheduled_for
       )
       SELECT expected.patient_id, expected.organization_id, expected.id,
              'dose_reminder', channel.value,
              expected.scheduled_for
                - (preference.reminder_lead_minutes * interval '1 minute')
       FROM medication_expected_doses expected
       JOIN patient_notification_preferences preference
         ON preference.patient_id = expected.patient_id
        AND preference.organization_id = expected.organization_id
       CROSS JOIN LATERAL jsonb_array_elements_text(
         preference.enabled_channels
       ) AS channel(value)
       WHERE expected.patient_id = $1 AND expected.organization_id = $2
         AND expected.scheduled_for >= $3 AND expected.scheduled_for <= $4
         AND expected.status = 'scheduled'
         AND preference.status = 'active'
         AND channel.value IN ('push', 'email', 'sms')
       ON CONFLICT (expected_dose_id, job_type, channel) DO NOTHING
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
         RETURNING job.*`,
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
