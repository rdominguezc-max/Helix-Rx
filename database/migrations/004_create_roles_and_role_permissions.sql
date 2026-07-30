CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT roles_code_not_blank CHECK (length(trim(code)) > 0),
  CONSTRAINT roles_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT roles_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT roles_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT roles_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_code_unique_active
  ON roles (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS roles_status_idx
  ON roles (status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id),
  permission_id uuid NOT NULL REFERENCES permissions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_permission_unique_active
  ON role_permissions (role_id, permission_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS role_permissions_role_idx
  ON role_permissions (role_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS role_permissions_permission_idx
  ON role_permissions (permission_id)
  WHERE deleted_at IS NULL;

INSERT INTO roles (code, name, description)
VALUES
  ('platform_admin', 'Platform Admin', 'Internal platform administrator with operational platform permissions'),
  ('organization_owner', 'Organization Owner', 'Organization owner responsible for tenant administration'),
  ('organization_admin', 'Organization Admin', 'Organization administrator for tenant operations'),
  ('physician', 'Physician', 'Healthcare professional responsible for patient follow-up'),
  ('medical_assistant', 'Medical Assistant', 'Medical assistant supporting physician workflows'),
  ('caregiver', 'Caregiver', 'Authorized caregiver or family member supporting patient continuity of care'),
  ('patient', 'Patient', 'Patient using helix for continuity of care')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'users.read',
  'users.write',
  'organizations.read',
  'organizations.write',
  'memberships.read',
  'memberships.write',
  'permissions.read',
  'patients.read',
  'patients.write',
  'medications.read',
  'medications.write',
  'appointments.read',
  'appointments.write',
  'clinical_events.read',
  'clinical_events.write',
  'audit.read'
)
WHERE roles.code = 'platform_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'users.read',
  'organizations.read',
  'organizations.write',
  'memberships.read',
  'memberships.write',
  'permissions.read'
)
WHERE roles.code = 'organization_owner'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'users.read',
  'organizations.read',
  'memberships.read',
  'memberships.write',
  'permissions.read'
)
WHERE roles.code = 'organization_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'users.read',
  'patients.read',
  'patients.write',
  'medications.read',
  'medications.write',
  'appointments.read',
  'appointments.write',
  'clinical_events.read',
  'clinical_events.write'
)
WHERE roles.code = 'physician'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'users.read',
  'patients.read',
  'medications.read',
  'appointments.read',
  'appointments.write',
  'clinical_events.read'
)
WHERE roles.code = 'medical_assistant'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'patients.read',
  'medications.read',
  'appointments.read',
  'clinical_events.read',
  'clinical_events.write'
)
WHERE roles.code = 'caregiver'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code IN (
  'patients.read',
  'patients.write',
  'medications.read',
  'appointments.read',
  'clinical_events.read',
  'clinical_events.write'
)
WHERE roles.code = 'patient'
ON CONFLICT DO NOTHING;
