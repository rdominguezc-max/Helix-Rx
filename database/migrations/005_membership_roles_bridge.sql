ALTER TABLE organization_memberships
  ADD COLUMN IF NOT EXISTS role_id uuid;

UPDATE organization_memberships
SET role_id = roles.id
FROM roles
WHERE role_id IS NULL
  AND roles.code = CASE organization_memberships.relationship
    WHEN 'owner' THEN 'organization_owner'
    WHEN 'admin' THEN 'organization_admin'
    WHEN 'medical_staff' THEN 'medical_assistant'
    WHEN 'caregiver' THEN 'caregiver'
    WHEN 'member' THEN 'patient'
  END;

ALTER TABLE organization_memberships
  ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_role_id_fkey;

ALTER TABLE organization_memberships
  ADD CONSTRAINT organization_memberships_role_id_fkey
  FOREIGN KEY (role_id)
  REFERENCES roles(id);

CREATE INDEX IF NOT EXISTS organization_memberships_role_idx
  ON organization_memberships (role_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN organization_memberships.relationship IS
  'Legacy semantic membership relationship kept for compatibility. Formal RBAC must use role_id.';

COMMENT ON COLUMN organization_memberships.role_id IS
  'Formal RBAC role assigned to this organization membership.';
