CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requester_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT password_recovery_email_normalized CHECK (email = lower(trim(email)) AND length(email) BETWEEN 3 AND 254),
  CONSTRAINT password_recovery_status_valid CHECK (status IN ('pending', 'resolved')),
  CONSTRAINT password_recovery_resolution_consistent CHECK (
    (status = 'pending' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS password_recovery_pending_created_idx
  ON password_recovery_requests (created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS password_recovery_email_created_idx
  ON password_recovery_requests (email, created_at DESC);
CREATE INDEX IF NOT EXISTS password_recovery_requester_created_idx
  ON password_recovery_requests (requester_key, created_at DESC);
