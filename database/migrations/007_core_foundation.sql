CREATE TABLE IF NOT EXISTS system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT system_parameters_key_not_blank CHECK (length(trim(key)) > 0),
  CONSTRAINT system_parameters_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS system_parameters_key_unique_active
  ON system_parameters (key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT organization_settings_key_not_blank CHECK (length(trim(key)) > 0),
  CONSTRAINT organization_settings_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_org_key_unique_active
  ON organization_settings (organization_id, key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS supported_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  native_name text NOT NULL,
  default_locale text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT supported_languages_code_not_blank CHECK (length(trim(code)) > 0),
  CONSTRAINT supported_languages_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS supported_languages_code_unique_active
  ON supported_languages (code)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS supported_timezones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_code text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT supported_timezones_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT supported_timezones_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS supported_timezones_name_unique_active
  ON supported_timezones (name)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  organization_id uuid REFERENCES organizations(id),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT feature_flags_key_not_blank CHECK (length(trim(key)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_key_global_unique_active
  ON feature_flags (key)
  WHERE organization_id IS NULL
    AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_key_org_unique_active
  ON feature_flags (organization_id, key)
  WHERE organization_id IS NOT NULL
    AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog text NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  locale text NOT NULL DEFAULT 'es-MX',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT catalog_items_catalog_not_blank CHECK (length(trim(catalog)) > 0),
  CONSTRAINT catalog_items_code_not_blank CHECK (length(trim(code)) > 0),
  CONSTRAINT catalog_items_label_not_blank CHECK (length(trim(label)) > 0),
  CONSTRAINT catalog_items_status_valid CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_catalog_code_locale_unique_active
  ON catalog_items (catalog, code, locale)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS catalog_items_catalog_locale_idx
  ON catalog_items (catalog, locale, sort_order)
  WHERE deleted_at IS NULL;

INSERT INTO supported_languages (code, name, native_name, default_locale)
VALUES
  ('es', 'Spanish', 'Español', 'es-MX'),
  ('en', 'English', 'English', 'en-US')
ON CONFLICT DO NOTHING;

INSERT INTO supported_timezones (name, country_code)
VALUES
  ('UTC', NULL),
  ('America/Hermosillo', 'MX'),
  ('America/Mexico_City', 'MX'),
  ('America/Tijuana', 'MX'),
  ('America/New_York', 'US'),
  ('America/Los_Angeles', 'US')
ON CONFLICT DO NOTHING;

INSERT INTO system_parameters (key, value, description)
VALUES
  ('platform.default_language', '"es"'::jsonb, 'Default platform language'),
  ('platform.default_locale', '"es-MX"'::jsonb, 'Default platform locale'),
  ('platform.default_timezone', '"America/Hermosillo"'::jsonb, 'Default platform timezone')
ON CONFLICT DO NOTHING;

INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('auth.firebase.enabled', false, 'Prepared flag for Firebase Authentication'),
  ('frontend.pwa.enabled', false, 'Prepared flag for PWA frontend'),
  ('clinical.modules.enabled', false, 'Prepared flag for clinical modules')
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog, code, label, locale, sort_order)
VALUES
  ('audit_results', 'success', 'Exitoso', 'es-MX', 10),
  ('audit_results', 'failure', 'Falla', 'es-MX', 20),
  ('audit_results', 'denied', 'Denegado', 'es-MX', 30),
  ('user_statuses', 'active', 'Activo', 'es-MX', 10),
  ('user_statuses', 'inactive', 'Inactivo', 'es-MX', 20),
  ('user_statuses', 'suspended', 'Suspendido', 'es-MX', 30)
ON CONFLICT DO NOTHING;
