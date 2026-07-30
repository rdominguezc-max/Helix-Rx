import type {
  InventoryMovementType,
  MedicationInventoryLot,
  MedicationInventoryMovement,
} from './medication-inventory.entity';

export interface AddInventoryLotData {
  patientId: string;
  organizationId: string;
  presentationId: string;
  lotNumber?: string | null;
  quantityAcquired: number;
  acquiredAt?: Date | null;
  expiresOn?: Date | null;
  unitCost?: number | null;
  currencyCode?: string | null;
  pharmacyName?: string | null;
  createdBy?: string | null;
}

export interface RecordInventoryMovementData {
  inventoryLotId: string;
  patientId: string;
  organizationId: string;
  patientTreatmentId?: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  reason?: string | null;
  occurredAt?: Date | null;
  recordedBy?: string | null;
}

export interface MedicationInventoryRepository {
  presentationBelongsToOrganization(
    presentationId: string,
    organizationId: string,
  ): Promise<boolean>;
  patientHasActiveMembership(
    patientId: string,
    organizationId: string,
  ): Promise<boolean>;
  addLot(data: AddInventoryLotData): Promise<MedicationInventoryLot>;
  listLots(
    patientId: string,
    organizationId: string,
  ): Promise<MedicationInventoryLot[]>;
  recordMovement(
    data: RecordInventoryMovementData,
  ): Promise<MedicationInventoryMovement>;
}

export const MEDICATION_INVENTORY_REPOSITORY = Symbol(
  'MEDICATION_INVENTORY_REPOSITORY',
);
