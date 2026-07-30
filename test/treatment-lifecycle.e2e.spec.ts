import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedRequestContext } from '../src/modules/auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { ChangeTreatmentStatusUseCase } from '../src/modules/medications/application/change-treatment-status.use-case';
import { GetTreatmentInsightUseCase } from '../src/modules/medications/application/get-treatment-insight.use-case';
import { ListDoseEventsUseCase } from '../src/modules/medications/application/list-dose-events.use-case';
import { RecordDoseEventUseCase } from '../src/modules/medications/application/record-dose-event.use-case';
import { TreatmentLifecycleController } from '../src/modules/medications/http/treatment-lifecycle.controller';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const treatmentId = '44444444-4444-4444-8444-444444444444';
const scheduledFor = '2026-07-30T15:00:00.000Z';

describe('Treatment Lifecycle API Boundary', () => {
  it('blocks dose events when guards deny the request', async () => {
    const app = await createTestApp(false);

    await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/dose-events`,
      )
      .expect(403);

    await app.close();
  });

  it('passes authenticated organization context to status changes', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .patch(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/status`,
      )
      .send({ newStatus: 'paused' })
      .expect(200);

    expect(response.body).toMatchObject({
      previousStatus: 'active',
      newStatus: 'paused',
    });
    expect(commands[0]).toMatchObject({
      patientId,
      treatmentId,
      organizationId,
      actorUserId: userId,
      newStatus: 'paused',
    });

    await app.close();
  });

  it('parses and records a confirmed dose event', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .post(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/dose-events`,
      )
      .send({
        scheduledFor,
        occurredAt: scheduledFor,
        eventStatus: 'confirmed',
        idempotencyKey: 'dose-boundary-test',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      eventStatus: 'confirmed',
      idempotencyKey: 'dose-boundary-test',
    });
    expect(commands[0]).toMatchObject({
      patientId,
      treatmentId,
      organizationId,
      actorUserId: userId,
      eventStatus: 'confirmed',
    });

    await app.close();
  });

  it('rejects an invalid scheduled date at the HTTP boundary', async () => {
    const app = await createTestApp(true);

    const response = await request(app.getHttpServer())
      .post(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/dose-events`,
      )
      .send({
        scheduledFor: 'not-a-date',
        eventStatus: 'cancelled',
        idempotencyKey: 'invalid-date',
      })
      .expect(400);

    expect(response.body.message).toContain('scheduledFor must be valid');
    await app.close();
  });

  it('returns treatment insight with parsed projection options', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/insight`,
      )
      .query({
        windowDays: '14',
        lowInventoryDays: '5',
        expirationWarningDays: '20',
        asOf: scheduledFor,
      })
      .expect(200);

    expect(response.body.inventory).toMatchObject({
      estimatedDaysRemaining: 5,
      riskLevel: 'medium',
    });
    expect(commands[0]).toMatchObject({
      patientId,
      treatmentId,
      organizationId,
      windowDays: 14,
      lowInventoryDays: 5,
      expirationWarningDays: 20,
    });
    await app.close();
  });

  it('rejects non-integer insight options', async () => {
    const app = await createTestApp(true);

    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/insight`,
      )
      .query({ windowDays: '7.5' })
      .expect(400);

    expect(response.body.message).toContain('windowDays must be an integer');
    await app.close();
  });
});

async function createTestApp(
  allowGuards: boolean,
  commands: unknown[] = [],
): Promise<INestApplication> {
  const authenticatedUser: AuthenticatedRequestContext = {
    userId,
    firebaseUid: 'firebase-user',
    email: 'clinician@example.com',
    emailVerified: true,
    organizationId,
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [TreatmentLifecycleController],
    providers: [
      {
        provide: ChangeTreatmentStatusUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return {
              id: '55555555-5555-4555-8555-555555555555',
              patientTreatmentId: treatmentId,
              previousStatus: 'active',
              newStatus: 'paused',
              reason: null,
              changedBy: userId,
              changedAt: new Date(scheduledFor),
            };
          },
        },
      },
      {
        provide: RecordDoseEventUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return {
              id: '66666666-6666-4666-8666-666666666666',
              patientTreatmentId: treatmentId,
              patientId,
              organizationId,
              scheduledFor: new Date(scheduledFor),
              eventStatus: 'confirmed',
              occurredAt: new Date(scheduledFor),
              timingStatus: 'on_time',
              prescribedDoseAmount: 1500,
              prescribedDoseUnit: 'mg',
              omissionReason: null,
              idempotencyKey: 'dose-boundary-test',
              recordedBy: userId,
              createdAt: new Date(scheduledFor),
              updatedAt: new Date(scheduledFor),
              allocations: [],
            };
          },
        },
      },
      {
        provide: ListDoseEventsUseCase,
        useValue: { execute: async () => [] },
      },
      {
        provide: GetTreatmentInsightUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return {
              patientId,
              organizationId,
              treatmentId,
              asOf: new Date(scheduledFor),
              adherence: {
                windowStartsAt: new Date(scheduledFor),
                windowEndsAt: new Date(scheduledFor),
                recordedEvents: 10,
                confirmedDoses: 8,
                omittedDoses: 2,
                cancelledDoses: 0,
                adherenceRate: 0.8,
                onTimeDoses: 7,
                punctualityRate: 0.875,
              },
              inventory: {
                totalAdministrationUnits: 15,
                prescribedDoseCoverage: 15000,
                estimatedDosesRemaining: 10,
                expectedDosesPerDay: 2,
                estimatedDaysRemaining: 5,
                estimatedDepletionAt: new Date(scheduledFor),
                nextExpirationOn: null,
                riskLevel: 'medium',
              },
              alerts: [],
            };
          },
        },
      },
    ],
  })
    .overrideGuard(FirebaseBearerAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => {
            authenticatedUser?: AuthenticatedRequestContext;
          };
        };
      }) => {
        if (!allowGuards) return false;
        context.switchToHttp().getRequest().authenticatedUser =
          authenticatedUser;
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
