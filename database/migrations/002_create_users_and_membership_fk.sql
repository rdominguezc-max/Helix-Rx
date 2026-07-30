CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  language text NOT NULL DEFAULT 'es',
  timezone text NOT NULL DEFAULT 'America/Hermosillo',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_first_name_not_blank CHECK (length(trim(first_name)) > 0),
  CONSTRAINT users_last_name_not_blank CHECK (length(trim(last_name)) > 0),
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT users_language_valid CHECK (language IN ('es', 'en')),
  CONSTRAINT users_status_valid CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_active
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS users_status_idx
  ON users (status)
  WHERE deleted_at IS NULL;

ALTER TABLE organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_user_id_fkey;

ALTER TABLE organization_memberships
  ADD CONSTRAINT organization_memberships_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id);

COMMENT ON COLUMN organization_memberships.user_id IS
  'Relation to users.id. Membership authorization depends on this user-organization link.';
