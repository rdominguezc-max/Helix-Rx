INSERT INTO permissions (code, description, resource, action)
VALUES
  ('notifications.read', 'Read notification settings and delivery state', 'notifications', 'read'),
  ('notifications.write', 'Manage notification settings and delivery state', 'notifications', 'write')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN ('notifications.read', 'notifications.write')
WHERE roles.code IN ('platform_admin', 'physician')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code = 'notifications.read'
WHERE roles.code IN ('medical_assistant', 'caregiver', 'patient')
ON CONFLICT DO NOTHING;

CREATE TABLE patient_notification_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  channel text NOT NULL,
  destination_reference text NOT NULL,
  masked_label text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_destinations_channel_valid CHECK (channel IN ('push', 'email', 'sms')),
  CONSTRAINT notification_destinations_reference_not_blank CHECK (length(trim(destination_reference)) > 0),
  CONSTRAINT notification_destinations_label_not_blank CHECK (length(trim(masked_label)) > 0),
  CONSTRAINT notification_destinations_status_valid CHECK (status IN ('pending', 'verified', 'revoked')),
  CONSTRAINT notification_destinations_verification_consistent CHECK (
    (status = 'pending' AND verified_at IS NULL AND revoked_at IS NULL)
    OR (status = 'verified' AND verified_at IS NOT NULL AND revoked_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX notification_destinations_reference_unique_active
  ON patient_notification_destinations (
    patient_id, organization_id, channel, destination_reference
  )
  WHERE status <> 'revoked';

CREATE INDEX notification_destinations_verified_idx
  ON patient_notification_destinations (patient_id, organization_id, channel)
  WHERE status = 'verified';

ALTER TABLE notification_jobs
  ADD COLUMN destination_id uuid REFERENCES patient_notification_destinations(id);

DROP INDEX notification_jobs_dedup_unique;
CREATE UNIQUE INDEX notification_jobs_dedup_unique
  ON notification_jobs (expected_dose_id, job_type, channel, destination_id)
  WHERE destination_id IS NOT NULL;

COMMENT ON COLUMN patient_notification_destinations.destination_reference IS
  'Opaque provider-side destination identifier; never a raw email, phone number or push token.';
