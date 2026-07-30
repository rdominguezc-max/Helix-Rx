CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  generic_name text NOT NULL,
  active_ingredient text NOT NULL,
  medication_form text NOT NULL,
  route text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT medications_generic_name_not_blank CHECK (length(trim(generic_name)) > 0),
  CONSTRAINT medications_active_ingredient_not_blank CHECK (length(trim(active_ingredient)) > 0),
  CONSTRAINT medications_form_not_blank CHECK (length(trim(medication_form)) > 0),
  CONSTRAINT medications_route_not_blank CHECK (length(trim(route)) > 0),
  CONSTRAINT medications_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS medications_catalog_unique_active
  ON medications (
    COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(generic_name),
    lower(active_ingredient),
    lower(medication_form),
    lower(route)
  )
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS medications_organization_idx
  ON medications (organization_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS medication_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id),
  brand_name text,
  manufacturer text,
  strength_amount numeric(12, 4) NOT NULL,
  strength_unit text NOT NULL,
  administration_unit text NOT NULL,
  package_quantity numeric(12, 4) NOT NULL,
  country_code text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT medication_presentations_strength_positive CHECK (strength_amount > 0),
  CONSTRAINT medication_presentations_package_positive CHECK (package_quantity > 0),
  CONSTRAINT medication_presentations_strength_unit_not_blank CHECK (length(trim(strength_unit)) > 0),
  CONSTRAINT medication_presentations_admin_unit_not_blank CHECK (length(trim(administration_unit)) > 0),
  CONSTRAINT medication_presentations_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS medication_presentations_medication_idx
  ON medication_presentations (medication_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  medication_id uuid NOT NULL REFERENCES medications(id),
  prescribed_by uuid REFERENCES users(id),
  dose_amount numeric(12, 4) NOT NULL,
  dose_unit text NOT NULL,
  frequency_interval_hours numeric(8, 2),
  administration_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text,
  starts_on date NOT NULL,
  ends_on date,
  is_as_needed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  discontinued_at timestamptz,
  discontinued_by uuid REFERENCES users(id),
  discontinuation_reason text,
  deleted_at timestamptz,
  CONSTRAINT patient_treatments_dose_positive CHECK (dose_amount > 0),
  CONSTRAINT patient_treatments_dose_unit_not_blank CHECK (length(trim(dose_unit)) > 0),
  CONSTRAINT patient_treatments_frequency_positive CHECK (
    frequency_interval_hours IS NULL OR frequency_interval_hours > 0
  ),
  CONSTRAINT patient_treatments_dates_valid CHECK (
    ends_on IS NULL OR ends_on >= starts_on
  ),
  CONSTRAINT patient_treatments_status_valid CHECK (
    status IN ('draft', 'active', 'paused', 'completed', 'discontinued')
  ),
  CONSTRAINT patient_treatments_schedule_present CHECK (
    is_as_needed = true
    OR frequency_interval_hours IS NOT NULL
    OR jsonb_array_length(administration_times) > 0
  )
);

CREATE INDEX IF NOT EXISTS patient_treatments_patient_org_idx
  ON patient_treatments (patient_id, organization_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS patient_treatments_medication_idx
  ON patient_treatments (medication_id, status)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE medications IS
  'Medication clinical concept. It is intentionally separate from commercial presentations.';

COMMENT ON TABLE medication_presentations IS
  'Commercial product purchased by a patient. Inventory is not stored in this table.';

COMMENT ON TABLE patient_treatments IS
  'Patient prescription/treatment instructions. Reminder schedules and dose events are separate future domains.';
