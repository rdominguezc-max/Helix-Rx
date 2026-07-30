ALTER TABLE notification_jobs
  ADD COLUMN next_attempt_at timestamptz,
  ADD COLUMN max_attempts integer NOT NULL DEFAULT 5,
  ADD COLUMN exhausted_at timestamptz,
  ADD CONSTRAINT notification_jobs_max_attempts_valid CHECK (
    max_attempts BETWEEN 1 AND 20
  );

UPDATE notification_jobs
SET next_attempt_at = scheduled_for
WHERE next_attempt_at IS NULL;

ALTER TABLE notification_jobs
  ALTER COLUMN next_attempt_at SET NOT NULL;

ALTER TABLE notification_delivery_events
  ADD COLUMN retry_scheduled_at timestamptz;

DROP INDEX notification_jobs_claim_idx;
CREATE INDEX notification_jobs_claim_idx
  ON notification_jobs (next_attempt_at, scheduled_for, id)
  WHERE status IN ('pending', 'processing');

COMMENT ON COLUMN notification_jobs.next_attempt_at IS
  'Earliest instant at which a pending job may be claimed.';
COMMENT ON COLUMN notification_jobs.max_attempts IS
  'Hard delivery-attempt limit including the first attempt.';
