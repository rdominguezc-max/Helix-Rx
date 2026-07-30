import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type {
  MedicationInventoryLot,
  MedicationInventoryMovement,
} from '../domain/medication-inventory.entity';
import type {
  AddInventoryLotData,
  MedicationInventoryRepository,
  RecordInventoryMovementData,
} from '../domain/medication-inventory.repository';
import { AddInventoryLotUseCase } from './add-inventory-lot.use-case';
import { DoseConversionService } from './dose-conversion.service';
import { RecordInventoryMovementUseCase } from './record-inventory-movement.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const presentationId = '33333333-3333-4333-8333-333333333333';
const lotId = '44444444-4444-4444-8444-444444444444';
const userId = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-07-30T00:00:00.000Z');

function lotFixture(): MedicationInventoryLot {
  return {
    id: lotId,
    patientId,
    organizationId,
    presentationId,
    lotNumber: null,
    quantityAcquired: 30,
    quantityRemaining: 30,
    acquiredAt: now,
    expiresOn: null,
    unitCost: null,
    currencyCode: null,
    pharmacyName: null,
    status: 'active',
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

class InventoryRepositoryFixture implements MedicationInventoryRepository {
  hasMembership = true;
  hasPresentation = true;
  lot = lotFixture();

  async presentationBelongsToOrganization(): Promise<boolean> {
    return this.hasPresentation;
  }

  async patientHasActiveMembership(): Promise<boolean> {
    return this.hasMembership;
  }

  async addLot(data: AddInventoryLotData): Promise<MedicationInventoryLot> {
    this.lot = {
      ...this.lot,
      ...data,
      acquiredAt: data.acquiredAt ?? this.lot.acquiredAt,
      expiresOn: data.expiresOn ?? null,
      unitCost: data.unitCost ?? null,
      currencyCode: data.currencyCode ?? null,
      pharmacyName: data.pharmacyName ?? null,
      createdBy: data.createdBy ?? null,
    };
    return this.lot;
  }

  async listLots(): Promise<MedicationInventoryLot[]> {
    return [this.lot];
  }

  async recordMovement(
    data: RecordInventoryMovementData,
  ): Promise<MedicationInventoryMovement> {
    const balanceAfter = this.lot.quantityRemaining + data.quantityDelta;
    if (balanceAfter < 0) throw new Error('insufficient inventory');
    this.lot = { ...this.lot, quantityRemaining: balanceAfter };
    return {
      id: '66666666-6666-4666-8666-666666666666',
      inventoryLotId: data.inventoryLotId,
      patientTreatmentId: data.patientTreatmentId ?? null,
      movementType: data.movementType,
      quantityDelta: data.quantityDelta,
      balanceAfter,
      reason: data.reason ?? null,
      occurredAt: data.occurredAt ?? now,
      recordedBy: data.recordedBy ?? null,
      createdAt: now,
    };
  }
}

function auditFixture(): AuditService {
  return {
    recordEvent: async (event) => ({
      id: '77777777-7777-4777-8777-777777777777',
      actorUserId: event.actorUserId ?? null,
      organizationId: event.organizationId ?? null,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      result: event.result,
      ipAddress: null,
      userAgent: null,
      metadata: event.metadata ?? {},
      createdAt: now,
    }),
  } as AuditService;
}

describe('Medication dose conversion and inventory', () => {
  it('converts 1500 mg into 1.5 tablets of 1000 mg', () => {
    const conversion = new DoseConversionService().convert({
      prescribedDose: 1500,
      prescribedUnit: 'mg',
      strengthAmount: 1000,
      strengthUnit: 'mg',
      administrationUnit: 'tablet',
    });
    expect(conversion.unitsPerDose).toBe(1.5);
  });

  it('supports quarter administration units without floating point drift', () => {
    const conversion = new DoseConversionService().convert({
      prescribedDose: 250,
      prescribedUnit: 'mg',
      strengthAmount: 1000,
      strengthUnit: 'mg',
      administrationUnit: 'tablet',
    });
    expect(conversion.unitsPerDose).toBe(0.25);
  });

  it('rejects implicit unit conversion', () => {
    expect(() =>
      new DoseConversionService().convert({
        prescribedDose: 1,
        prescribedUnit: 'g',
        strengthAmount: 500,
        strengthUnit: 'mg',
        administrationUnit: 'tablet',
      }),
    ).toThrow('unit conversion is not supported yet');
  });

  it('projects ten days for 30 tablets at 1.5 tablets twice daily', () => {
    const projection = new DoseConversionService().project({
      totalUnitsRemaining: 30,
      unitsPerDose: 1.5,
      frequencyIntervalHours: 12,
      from: now,
    });
    expect(projection).toMatchObject({
      dosesPerDay: 2,
      dailyUnits: 3,
      daysRemaining: 10,
    });
    expect(projection.estimatedDepletionAt?.toISOString()).toBe(
      '2026-08-09T00:00:00.000Z',
    );
  });

  it('creates a purchase lot only for a patient and presentation in tenant', async () => {
    const repository = new InventoryRepositoryFixture();
    const useCase = new AddInventoryLotUseCase(repository, auditFixture());
    const lot = await useCase.execute({
      patientId,
      organizationId,
      presentationId,
      quantityAcquired: 30,
      currencyCode: 'mxn',
      actorUserId: userId,
    });
    expect(lot).toMatchObject({ quantityRemaining: 30, currencyCode: 'MXN' });
  });

  it('requires consumption movements to be negative', async () => {
    const useCase = new RecordInventoryMovementUseCase(
      new InventoryRepositoryFixture(),
      auditFixture(),
    );
    await expect(
      useCase.execute({
        patientId,
        organizationId,
        inventoryLotId: lotId,
        movementType: 'administration',
        quantityDelta: 1.5,
      }),
    ).rejects.toThrow('administration quantityDelta must be negative');
  });
});
