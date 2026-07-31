INSERT INTO permissions (code, description, resource, action)
VALUES (
  'adherence.write',
  'Record patient medication dose outcomes',
  'adherence',
  'write'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions ON permissions.code = 'adherence.write'
WHERE roles.code IN (
  'platform_admin',
  'physician',
  'medical_assistant',
  'caregiver',
  'patient'
)
ON CONFLICT DO NOTHING;
