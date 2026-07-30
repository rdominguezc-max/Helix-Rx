export type InventoryLotStatus =
  | 'active'
  | 'depleted'
  | 'expired'
  | 'discarded';
export type InventoryMovementType =
  | 'purchase'
  | 'administration'
  | 'adjustment'
  | 'waste'
  | 'return';

export interface MedicationInventoryLot {
  id: string;
  patientId: string;
  organizationId: string;
  presentationId: string;
  lotNumber: string | null;
  quantityAcquired: number;
  quantityRemaining: number;
  acquiredAt: Date;
  expiresOn: Date | null;
  unitCost: number | null;
  currencyCode: string | null;
  pharmacyName: string | null;
  status: InventoryLotStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MedicationInventoryMovement {
  id: string;
  inventoryLotId: string;
  patientTreatmentId: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  balanceAfter: number;
  reason: string | null;
  occurredAt: Date;
  recordedBy: string | null;
  createdAt: Date;
}

export interface DoseConversion {
  prescribedDose: number;
  prescribedUnit: string;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
  unitsPerDose: number;
}

export interface InventoryProjection {
  totalUnitsRemaining: number;
  unitsPerDose: number;
  dosesPerDay: number;
  dailyUnits: number;
  daysRemaining: number | null;
  estimatedDepletionAt: Date | null;
}
