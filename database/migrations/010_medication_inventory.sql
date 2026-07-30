CREATE TABLE IF NOT EXISTS patient_medication_inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  presentation_id uuid NOT NULL REFERENCES medication_presentations(id),
  lot_number text,
  quantity_acquired numeric(12, 4) NOT NULL,
  quantity_remaining numeric(12, 4) NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_on date,
  unit_cost numeric(12, 2),
  currency_code text,
  pharmacy_name text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT medication_inventory_quantity_acquired_positive CHECK (quantity_acquired > 0),
  CONSTRAINT medication_inventory_quantity_remaining_valid CHECK (
    quantity_remaining >= 0 AND quantity_remaining <= quantity_acquired
  ),
  CONSTRAINT medication_inventory_unit_cost_valid CHECK (
    unit_cost IS NULL OR unit_cost >= 0
  ),
  CONSTRAINT medication_inventory_currency_valid CHECK (
    currency_code IS NULL OR length(trim(currency_code)) = 3
  ),
  CONSTRAINT medication_inventory_status_valid CHECK (
    status IN ('active', 'depleted', 'expired', 'discarded')
  )
);

CREATE INDEX IF NOT EXISTS medication_inventory_patient_org_idx
  ON patient_medication_inventory_lots (patient_id, organization_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS medication_inventory_expiration_idx
  ON patient_medication_inventory_lots (expires_on, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS medication_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_lot_id uuid NOT NULL REFERENCES patient_medication_inventory_lots(id),
  patient_treatment_id uuid REFERENCES patient_treatments(id),
  movement_type text NOT NULL,
  quantity_delta numeric(12, 4) NOT NULL,
  balance_after numeric(12, 4) NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_inventory_movement_nonzero CHECK (quantity_delta <> 0),
  CONSTRAINT medication_inventory_balance_nonnegative CHECK (balance_after >= 0),
  CONSTRAINT medication_inventory_movement_type_valid CHECK (
    movement_type IN ('purchase', 'administration', 'adjustment', 'waste', 'return')
  )
);

CREATE INDEX IF NOT EXISTS medication_inventory_movements_lot_idx
  ON medication_inventory_movements (inventory_lot_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS medication_inventory_movements_treatment_idx
  ON medication_inventory_movements (patient_treatment_id, occurred_at DESC)
  WHERE patient_treatment_id IS NOT NULL;

COMMENT ON TABLE patient_medication_inventory_lots IS
  'Commercial medication acquired by a patient, tracked in administration units.';

COMMENT ON TABLE medication_inventory_movements IS
  'Immutable inventory ledger. Negative deltas consume inventory and balance_after is captured for auditability.';
