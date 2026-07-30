CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  organization_id uuid REFERENCES organizations(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  result text NOT NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_action_not_blank CHECK (length(trim(action)) > 0),
  CONSTRAINT audit_logs_resource_type_not_blank CHECK (length(trim(resource_type)) > 0),
  CONSTRAINT audit_logs_result_valid CHECK (result IN ('success', 'failure', 'denied'))
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_user_idx
  ON audit_logs (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_organization_idx
  ON audit_logs (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_resource_idx
  ON audit_logs (resource_type, resource_id, created_at DESC)
  WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_result_idx
  ON audit_logs (result, created_at DESC);

COMMENT ON TABLE audit_logs IS
  'Append-only audit trail for sensitive business and security actions.';

COMMENT ON COLUMN audit_logs.metadata IS
  'Structured non-sensitive context. Do not store clinical payloads or secrets.';
