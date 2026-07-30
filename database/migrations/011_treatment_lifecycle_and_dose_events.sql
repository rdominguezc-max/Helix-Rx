CREATE TABLE IF NOT EXISTS patient_treatment_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_treatment_id uuid NOT NULL REFERENCES patient_treatments(id),
  previous_status text NOT NULL,
  new_status text NOT NULL,
  reason text,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT treatment_status_events_previous_valid CHECK (
    previous_status IN ('draft', 'active', 'paused', 'completed', 'discontinued')
  ),
  CONSTRAINT treatment_status_events_new_valid CHECK (
    new_status IN ('draft', 'active', 'paused', 'completed', 'discontinued')
  ),
  CONSTRAINT treatment_status_events_changed CHECK (previous_status <> new_status)
);

CREATE INDEX IF NOT EXISTS treatment_status_events_treatment_idx
  ON patient_treatment_status_events (patient_treatment_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS medication_dose_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_treatment_id uuid NOT NULL REFERENCES patient_treatments(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  scheduled_for timestamptz NOT NULL,
  event_status text NOT NULL,
  occurred_at timestamptz,
  timing_status text,
  prescribed_dose_amount numeric(12, 4) NOT NULL,
  prescribed_dose_unit text NOT NULL,
  omission_reason text,
  idempotency_key text NOT NULL,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_dose_events_status_valid CHECK (
    event_status IN ('confirmed', 'omitted', 'cancelled')
  ),
  CONSTRAINT medication_dose_events_timing_valid CHECK (
    timing_status IS NULL OR timing_status IN ('early', 'on_time', 'late')
  ),
  CONSTRAINT medication_dose_events_dose_positive CHECK (prescribed_dose_amount > 0),
  CONSTRAINT medication_dose_events_unit_not_blank CHECK (
    length(trim(prescribed_dose_unit)) > 0
  ),
  CONSTRAINT medication_dose_events_confirmation_time CHECK (
    event_status <> 'confirmed' OR occurred_at IS NOT NULL
  ),
  CONSTRAINT medication_dose_events_omission_reason CHECK (
    event_status <> 'omitted' OR length(trim(omission_reason)) > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS medication_dose_events_idempotency_unique
  ON medication_dose_events (organization_id, idempotency_key);

CREATE INDEX IF NOT EXISTS medication_dose_events_patient_idx
  ON medication_dose_events (patient_id, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS medication_dose_events_treatment_idx
  ON medication_dose_events (patient_treatment_id, scheduled_for DESC);

CREATE TABLE IF NOT EXISTS medication_dose_inventory_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_dose_event_id uuid NOT NULL REFERENCES medication_dose_events(id),
  inventory_lot_id uuid NOT NULL REFERENCES patient_medication_inventory_lots(id),
  inventory_movement_id uuid NOT NULL REFERENCES medication_inventory_movements(id),
  prescribed_amount_covered numeric(12, 4) NOT NULL,
  administration_units_consumed numeric(12, 4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dose_allocation_prescribed_positive CHECK (prescribed_amount_covered > 0),
  CONSTRAINT dose_allocation_units_positive CHECK (administration_units_consumed > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS dose_inventory_allocations_movement_unique
  ON medication_dose_inventory_allocations (inventory_movement_id);

CREATE INDEX IF NOT EXISTS dose_inventory_allocations_event_idx
  ON medication_dose_inventory_allocations (medication_dose_event_id);

COMMENT ON TABLE medication_dose_events IS
  'Clinical dose outcome. Idempotency prevents duplicate confirmation and duplicate inventory consumption.';

COMMENT ON TABLE medication_dose_inventory_allocations IS
  'FEFO allocation linking a confirmed dose to the exact inventory ledger movements.';
