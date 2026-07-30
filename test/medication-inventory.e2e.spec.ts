import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it } from 'vitest';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import type { HttpRequestWithAuth } from '../src/modules/auth/http/authenticated-request-context';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { AddInventoryLotUseCase } from '../src/modules/medications/application/add-inventory-lot.use-case';
import { DoseConversionService } from '../src/modules/medications/application/dose-conversion.service';
import { ListInventoryLotsUseCase } from '../src/modules/medications/application/list-inventory-lots.use-case';
import { RecordInventoryMovementUseCase } from '../src/modules/medications/application/record-inventory-movement.use-case';
import { MedicationInventoryController } from '../src/modules/medications/http/medication-inventory.controller';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const presentationId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-07-30T00:00:00.000Z');

describe('Medication Inventory API Boundary', () => {
  it('blocks patient inventory when guards deny the request', async () => {
    const app = await createTestApp(false);
    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientId}/medication-inventory`)
      .expect(403);
    await app.close();
  });

  it('registers a medication purchase when guards allow it', async () => {
    const app = await createTestApp(true);
    await request(app.getHttpServer())
      .post(`/api/v1/patients/${patientId}/medication-inventory`)
      .send({ presentationId, quantityAcquired: 30 })
      .expect(201);
    await app.close();
  });
});

async function createTestApp(allowGuards: boolean): Promise<INestApplication> {
  const lot = {
    id: '55555555-5555-4555-8555-555555555555',
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
    status: 'active' as const,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [MedicationInventoryController],
    providers: [
      { provide: AddInventoryLotUseCase, useValue: { execute: async () => lot } },
      {
        provide: ListInventoryLotsUseCase,
        useValue: { execute: async () => [lot] },
      },
      {
        provide: RecordInventoryMovementUseCase,
        useValue: { execute: async () => ({}) },
      },
      DoseConversionService,
    ],
  })
    .overrideGuard(FirebaseBearerAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => { getRequest: () => HttpRequestWithAuth };
      }) => {
        if (!allowGuards) return false;
        context.switchToHttp().getRequest().authenticatedUser = {
          userId,
          firebaseUid: 'firebase-user',
          email: 'clinician@example.com',
          emailVerified: true,
          organizationId,
        };
        return true;
      },
    })
    .overrideGuard(PermissionsGuard)
    .useValue({ canActivate: () => allowGuards })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}
