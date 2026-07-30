ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'es-MX';

CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_unique_active
  ON users (firebase_uid)
  WHERE firebase_uid IS NOT NULL
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS users_last_activity_at_idx
  ON users (last_activity_at)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT permissions_code_not_blank CHECK (length(trim(code)) > 0),
  CONSTRAINT permissions_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT permissions_resource_not_blank CHECK (length(trim(resource)) > 0),
  CONSTRAINT permissions_action_not_blank CHECK (length(trim(action)) > 0),
  CONSTRAINT permissions_code_format CHECK (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  CONSTRAINT permissions_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_unique_active
  ON permissions (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS permissions_resource_action_idx
  ON permissions (resource, action)
  WHERE deleted_at IS NULL;

INSERT INTO permissions (code, description, resource, action)
VALUES
  ('users.read', 'Read users', 'users', 'read'),
  ('users.write', 'Create and update users', 'users', 'write'),
  ('organizations.read', 'Read organizations', 'organizations', 'read'),
  ('organizations.write', 'Create and update organizations', 'organizations', 'write'),
  ('memberships.read', 'Read organization memberships', 'memberships', 'read'),
  ('memberships.write', 'Create and update organization memberships', 'memberships', 'write'),
  ('permissions.read', 'Read permissions catalog', 'permissions', 'read'),
  ('patients.read', 'Read patients', 'patients', 'read'),
  ('patients.write', 'Create and update patients', 'patients', 'write'),
  ('medications.read', 'Read medications', 'medications', 'read'),
  ('medications.write', 'Create and update medications', 'medications', 'write'),
  ('appointments.read', 'Read appointments', 'appointments', 'read'),
  ('appointments.write', 'Create and update appointments', 'appointments', 'write'),
  ('clinical_events.read', 'Read clinical events', 'clinical_events', 'read'),
  ('clinical_events.write', 'Create and update clinical events', 'clinical_events', 'write'),
  ('audit.read', 'Read audit log', 'audit', 'read')
ON CONFLICT DO NOTHING;
