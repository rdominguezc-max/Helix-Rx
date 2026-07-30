CREATE TABLE IF NOT EXISTS medication_expected_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_treatment_id uuid NOT NULL REFERENCES patient_treatments(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  scheduled_for timestamptz NOT NULL,
  timezone text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  medication_dose_event_id uuid REFERENCES medication_dose_events(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_expected_doses_timezone_not_blank CHECK (
    length(trim(timezone)) > 0
  ),
  CONSTRAINT medication_expected_doses_status_valid CHECK (
    status IN ('scheduled', 'fulfilled', 'cancelled')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS expected_doses_treatment_time_unique
  ON medication_expected_doses (patient_treatment_id, scheduled_for);

CREATE UNIQUE INDEX IF NOT EXISTS expected_doses_event_unique
  ON medication_expected_doses (medication_dose_event_id)
  WHERE medication_dose_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS expected_doses_patient_window_idx
  ON medication_expected_doses (
    patient_id,
    organization_id,
    scheduled_for
  );

CREATE INDEX IF NOT EXISTS expected_doses_pending_idx
  ON medication_expected_doses (scheduled_for)
  WHERE status = 'scheduled';

COMMENT ON TABLE medication_expected_doses IS
  'Materialized scheduled treatment occurrences. Missed is derived after the grace window when no outcome exists.';
