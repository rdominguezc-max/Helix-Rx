CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT organizations_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT organizations_slug_not_blank CHECK (length(trim(slug)) > 0),
  CONSTRAINT organizations_status_valid CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique_active
  ON organizations (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS organizations_status_idx
  ON organizations (status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL,
  relationship text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT organization_memberships_relationship_valid CHECK (
    relationship IN ('owner', 'admin', 'member', 'medical_staff', 'caregiver')
  ),
  CONSTRAINT organization_memberships_status_valid CHECK (
    status IN ('active', 'invited', 'inactive', 'suspended')
  )
);

COMMENT ON COLUMN organization_memberships.user_id IS
  'Prepared relation to users.id. Foreign key will be added when the users module creates the users table.';

CREATE UNIQUE INDEX IF NOT EXISTS organization_memberships_org_user_unique_active
  ON organization_memberships (organization_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS organization_memberships_user_idx
  ON organization_memberships (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS organization_memberships_organization_idx
  ON organization_memberships (organization_id)
  WHERE deleted_at IS NULL;
