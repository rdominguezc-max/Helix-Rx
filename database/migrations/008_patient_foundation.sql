CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  external_reference text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patients_status_valid CHECK (
    status IN ('draft', 'active', 'inactive', 'suspended', 'archived', 'deceased', 'merged')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patients_user_unique_active
  ON patients (user_id)
  WHERE user_id IS NOT NULL
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patients_status_idx
  ON patients (status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  administrative_sex text,
  phone text,
  email text,
  country_code text,
  blood_type text,
  height_cm numeric(6, 2),
  weight_kg numeric(6, 2),
  language text NOT NULL DEFAULT 'es',
  preferred_locale text NOT NULL DEFAULT 'es-MX',
  timezone text NOT NULL DEFAULT 'America/Hermosillo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patient_profiles_first_name_not_blank CHECK (length(trim(first_name)) > 0),
  CONSTRAINT patient_profiles_last_name_not_blank CHECK (length(trim(last_name)) > 0),
  CONSTRAINT patient_profiles_administrative_sex_valid CHECK (
    administrative_sex IS NULL OR administrative_sex IN ('female', 'male', 'other', 'unknown')
  ),
  CONSTRAINT patient_profiles_language_valid CHECK (language IN ('es', 'en')),
  CONSTRAINT patient_profiles_height_positive CHECK (height_cm IS NULL OR height_cm > 0),
  CONSTRAINT patient_profiles_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_profiles_patient_unique_active
  ON patient_profiles (patient_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  status text NOT NULL DEFAULT 'active',
  membership_type text NOT NULL DEFAULT 'primary',
  is_primary boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  revocation_reason text,
  deleted_at timestamptz,
  CONSTRAINT patient_org_memberships_status_valid CHECK (
    status IN ('active', 'inactive', 'suspended', 'revoked')
  ),
  CONSTRAINT patient_org_memberships_type_valid CHECK (
    membership_type IN ('primary', 'secondary', 'referral', 'program')
  ),
  CONSTRAINT patient_org_memberships_dates_valid CHECK (
    ends_at IS NULL OR ends_at >= starts_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_org_memberships_patient_org_unique_active
  ON patient_organization_memberships (patient_id, organization_id)
  WHERE status = 'active'
    AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS patient_org_memberships_primary_unique_active
  ON patient_organization_memberships (patient_id)
  WHERE status = 'active'
    AND is_primary = true
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_org_memberships_organization_idx
  ON patient_organization_memberships (organization_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_care_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  related_user_id uuid NOT NULL REFERENCES users(id),
  relationship_type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  access_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  revocation_reason text,
  deleted_at timestamptz,
  CONSTRAINT patient_care_relationships_type_valid CHECK (
    relationship_type IN (
      'self',
      'primary_physician',
      'treating_physician',
      'covering_physician',
      'consulting_physician',
      'medical_assistant',
      'family_member',
      'caregiver',
      'emergency_contact',
      'organization_admin_viewer'
    )
  ),
  CONSTRAINT patient_care_relationships_status_valid CHECK (
    status IN ('active', 'inactive', 'suspended', 'revoked')
  ),
  CONSTRAINT patient_care_relationships_dates_valid CHECK (
    ends_at IS NULL OR ends_at >= starts_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_care_relationships_unique_active
  ON patient_care_relationships (
    patient_id,
    organization_id,
    related_user_id,
    relationship_type
  )
  WHERE status = 'active'
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_care_relationships_user_idx
  ON patient_care_relationships (related_user_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  name text NOT NULL,
  relationship_label text NOT NULL,
  phone text NOT NULL,
  email text,
  preferred_language text,
  priority integer NOT NULL DEFAULT 1,
  can_receive_alerts boolean NOT NULL DEFAULT false,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patient_emergency_contacts_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT patient_emergency_contacts_relationship_not_blank CHECK (length(trim(relationship_label)) > 0),
  CONSTRAINT patient_emergency_contacts_phone_not_blank CHECK (length(trim(phone)) > 0),
  CONSTRAINT patient_emergency_contacts_priority_positive CHECK (priority > 0),
  CONSTRAINT patient_emergency_contacts_status_valid CHECK (
    status IN ('active', 'inactive')
  )
);

CREATE INDEX IF NOT EXISTS patient_emergency_contacts_patient_idx
  ON patient_emergency_contacts (patient_id, priority)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_insurance_coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  provider_name text NOT NULL,
  policy_number text,
  group_number text,
  plan_name text,
  coverage_type text NOT NULL DEFAULT 'unknown',
  country_code text,
  valid_from date,
  valid_to date,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patient_insurance_provider_not_blank CHECK (length(trim(provider_name)) > 0),
  CONSTRAINT patient_insurance_status_valid CHECK (
    status IN ('active', 'inactive', 'expired')
  ),
  CONSTRAINT patient_insurance_dates_valid CHECK (
    valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_insurance_primary_unique_active
  ON patient_insurance_coverages (patient_id)
  WHERE is_primary = true
    AND status = 'active'
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_insurance_patient_idx
  ON patient_insurance_coverages (patient_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  subject_user_id uuid REFERENCES users(id),
  granted_to_user_id uuid REFERENCES users(id),
  granted_to_organization_id uuid REFERENCES organizations(id),
  consent_type text NOT NULL,
  scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  captured_by uuid REFERENCES users(id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES users(id),
  revoked_at timestamptz,
  revocation_reason text,
  source text NOT NULL DEFAULT 'internal',
  evidence_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patient_consents_type_not_blank CHECK (length(trim(consent_type)) > 0),
  CONSTRAINT patient_consents_status_valid CHECK (
    status IN ('active', 'denied', 'revoked', 'expired')
  ),
  CONSTRAINT patient_consents_dates_valid CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE INDEX IF NOT EXISTS patient_consents_patient_org_idx
  ON patient_consents (patient_id, organization_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_consents_granted_user_idx
  ON patient_consents (granted_to_user_id, status)
  WHERE granted_to_user_id IS NOT NULL
    AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_reference_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  type text NOT NULL,
  value text NOT NULL,
  issuer text,
  country_code text,
  status text NOT NULL DEFAULT 'active',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT patient_reference_identifiers_type_not_blank CHECK (length(trim(type)) > 0),
  CONSTRAINT patient_reference_identifiers_value_not_blank CHECK (length(trim(value)) > 0),
  CONSTRAINT patient_reference_identifiers_status_valid CHECK (
    status IN ('active', 'inactive', 'verified')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_reference_identifiers_unique_active
  ON patient_reference_identifiers (type, value, issuer)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_reference_identifiers_patient_idx
  ON patient_reference_identifiers (patient_id, status)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE patients IS
  'Aggregate root for the Patient domain. Does not store medications, clinical records, reminders, or timeline data.';

COMMENT ON TABLE patient_organization_memberships IS
  'Patient to organization relationship. MVP allows one active primary membership per patient.';

COMMENT ON TABLE patient_consents IS
  'Patient consent records used by future relationship-based authorization.';
