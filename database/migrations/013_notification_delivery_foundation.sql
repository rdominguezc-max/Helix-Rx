CREATE TABLE IF NOT EXISTS patient_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  enabled_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  reminder_lead_minutes integer NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'active',
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_channels_array CHECK (
    jsonb_typeof(enabled_channels) = 'array'
  ),
  CONSTRAINT notification_preferences_lead_valid CHECK (
    reminder_lead_minutes BETWEEN 0 AND 1440
  ),
  CONSTRAINT notification_preferences_status_valid CHECK (
    status IN ('active', 'paused')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_patient_org_unique
  ON patient_notification_preferences (patient_id, organization_id);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  expected_dose_id uuid NOT NULL REFERENCES medication_expected_doses(id),
  job_type text NOT NULL,
  channel text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  claim_token uuid,
  claimed_by text,
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_jobs_type_valid CHECK (
    job_type IN ('dose_reminder')
  ),
  CONSTRAINT notification_jobs_channel_valid CHECK (
    channel IN ('push', 'email', 'sms')
  ),
  CONSTRAINT notification_jobs_status_valid CHECK (
    status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  CONSTRAINT notification_jobs_attempt_count_valid CHECK (attempt_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_jobs_dedup_unique
  ON notification_jobs (expected_dose_id, job_type, channel);

CREATE INDEX IF NOT EXISTS notification_jobs_claim_idx
  ON notification_jobs (scheduled_for, id)
  WHERE status IN ('pending', 'processing');

CREATE TABLE IF NOT EXISTS notification_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_job_id uuid NOT NULL REFERENCES notification_jobs(id),
  provider text NOT NULL,
  delivery_status text NOT NULL,
  provider_message_id text,
  error_code text,
  detail text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_delivery_provider_not_blank CHECK (
    length(trim(provider)) > 0
  ),
  CONSTRAINT notification_delivery_status_valid CHECK (
    delivery_status IN ('accepted', 'delivered', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS notification_delivery_job_idx
  ON notification_delivery_events (notification_job_id, occurred_at);

COMMENT ON TABLE notification_jobs IS
  'Provider-neutral patient reminder outbox. Claim leases allow safe concurrent workers.';

COMMENT ON TABLE notification_delivery_events IS
  'Immutable provider delivery history. No provider credentials or message payloads are stored.';
