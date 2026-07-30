import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it } from 'vitest';
import { AuditService } from '../src/modules/audit/application/audit.service';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import type { HttpRequestWithAuth } from '../src/modules/auth/http/authenticated-request-context';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { CreateMedicationUseCase } from '../src/modules/medications/application/create-medication.use-case';
import { CreatePresentationUseCase } from '../src/modules/medications/application/create-presentation.use-case';
import { CreateTreatmentUseCase } from '../src/modules/medications/application/create-treatment.use-case';
import { ListMedicationsUseCase } from '../src/modules/medications/application/list-medications.use-case';
import { ListPatientTreatmentsUseCase } from '../src/modules/medications/application/list-patient-treatments.use-case';
import { ListPresentationsUseCase } from '../src/modules/medications/application/list-presentations.use-case';
import { MedicationsController } from '../src/modules/medications/http/medications.controller';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const medicationId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-07-30T00:00:00.000Z');

describe('Medication API Boundary', () => {
  it('blocks treatment routes when authentication denies the request', async () => {
    const app = await createMedicationTestApp(false);
    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientId}/treatments`)
      .expect(403);
    await app.close();
  });

  it('creates a treatment when guards allow the request', async () => {
    const app = await createMedicationTestApp(true);
    await request(app.getHttpServer())
      .post(`/api/v1/patients/${patientId}/treatments`)
      .send({
        medicationId,
        doseAmount: 1500,
        doseUnit: 'mg',
        frequencyIntervalHours: 12,
        startsOn: '2026-07-30',
      })
      .expect(201);
    await app.close();
  });
});

async function createMedicationTestApp(
  allowGuards: boolean,
): Promise<INestApplication> {
  const medication = {
    id: medicationId,
    organizationId,
    genericName: 'Levetiracetam',
    activeIngredient: 'Levetiracetam',
    medicationForm: 'tablet',
    route: 'oral',
    status: 'active' as const,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const treatment = {
    id: '55555555-5555-4555-8555-555555555555',
    patientId,
    organizationId,
    medicationId,
    prescribedBy: userId,
    doseAmount: 1500,
    doseUnit: 'mg',
    frequencyIntervalHours: 12,
    administrationTimes: [],
    instructions: null,
    startsOn: now,
    endsOn: null,
    isAsNeeded: false,
    status: 'active' as const,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [MedicationsController],
    providers: [
      {
        provide: CreateMedicationUseCase,
        useValue: { execute: async () => medication },
      },
      {
        provide: ListMedicationsUseCase,
        useValue: { execute: async () => [medication] },
      },
      {
        provide: CreatePresentationUseCase,
        useValue: { execute: async () => ({}) },
      },
      {
        provide: ListPresentationsUseCase,
        useValue: { execute: async () => [] },
      },
      {
        provide: CreateTreatmentUseCase,
        useValue: { execute: async () => treatment },
      },
      {
        provide: ListPatientTreatmentsUseCase,
        useValue: { execute: async () => [treatment] },
      },
      {
        provide: AuditService,
        useValue: {
          recordEvent: async () => ({
            id: '66666666-6666-4666-8666-666666666666',
            actorUserId: userId,
            organizationId,
            action: 'patient.treatment.read',
            resourceType: 'patient_treatment',
            resourceId: null,
            result: 'success',
            ipAddress: null,
            userAgent: null,
            metadata: {},
            createdAt: now,
          }),
        },
      },
    ],
  })
    .overrideGuard(FirebaseBearerAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => { getRequest: () => HttpRequestWithAuth };
      }) => {
        if (!allowGuards) return false;
        const req = context.switchToHttp().getRequest();
        req.authenticatedUser = {
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
