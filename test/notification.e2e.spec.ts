import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedRequestContext } from '../src/modules/auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { ClaimNotificationJobsUseCase } from '../src/modules/medications/application/claim-notification-jobs.use-case';
import { GetNotificationPreferenceUseCase } from '../src/modules/medications/application/get-notification-preference.use-case';
import { PrepareNotificationJobsUseCase } from '../src/modules/medications/application/prepare-notification-jobs.use-case';
import { RecordNotificationDeliveryUseCase } from '../src/modules/medications/application/record-notification-delivery.use-case';
import { SetNotificationPreferenceUseCase } from '../src/modules/medications/application/set-notification-preference.use-case';
import { RegisterNotificationDestinationUseCase } from '../src/modules/medications/application/register-notification-destination.use-case';
import { ListNotificationDestinationsUseCase } from '../src/modules/medications/application/list-notification-destinations.use-case';
import { ChangeNotificationDestinationStatusUseCase } from '../src/modules/medications/application/change-notification-destination-status.use-case';
import { NotificationController } from '../src/modules/medications/http/notification.controller';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const jobId = '44444444-4444-4444-8444-444444444444';
const now = '2026-07-30T15:00:00.000Z';

describe('Notification API Boundary', () => {
  it('blocks notification preferences when guards deny access', async () => {
    const app = await createTestApp(false);
    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientId}/notifications/preference`)
      .expect(403);
    await app.close();
  });

  it('sets preference with tenant and actor context', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .put(`/api/v1/patients/${patientId}/notifications/preference`)
      .send({ enabledChannels: ['push'], reminderLeadMinutes: 15 })
      .expect(200);

    expect(response.body.enabledChannels).toEqual(['push']);
    expect(commands[0]).toMatchObject({
      patientId,
      organizationId,
      actorUserId: userId,
    });
    await app.close();
  });

  it('claims due jobs for a worker', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .post(`/api/v1/patients/${patientId}/notifications/jobs/claim`)
      .send({ workerId: 'worker-1', asOf: now, limit: 10 })
      .expect(201);

    expect(response.body).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      patientId,
      organizationId,
      workerId: 'worker-1',
      limit: 10,
    });
    await app.close();
  });

  it('rejects invalid preparation dates', async () => {
    const app = await createTestApp(true);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/patients/${patientId}/notifications/jobs/prepare`)
      .send({ windowStartsAt: 'not-a-date', windowEndsAt: now })
      .expect(400);
    expect(response.body.message).toContain('windowStartsAt must be valid');
    await app.close();
  });
});

async function createTestApp(
  allowGuards: boolean,
  commands: unknown[] = [],
): Promise<INestApplication> {
  const preference = {
    id: '55555555-5555-4555-8555-555555555555',
    patientId,
    organizationId,
    enabledChannels: ['push'],
    reminderLeadMinutes: 15,
    status: 'active',
    updatedBy: userId,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
  const job = {
    id: jobId,
    patientId,
    organizationId,
    expectedDoseId: '66666666-6666-4666-8666-666666666666',
    jobType: 'dose_reminder',
    channel: 'push',
    destinationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    destinationReference: 'provider-destination-1',
    destinationMaskedLabel: 'device …1234',
    scheduledFor: new Date(now),
    status: 'processing',
    claimToken: '77777777-7777-4777-8777-777777777777',
    claimedBy: 'worker-1',
    claimedAt: new Date(now),
    leaseExpiresAt: new Date(now),
    attemptCount: 1,
    lastError: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [NotificationController],
    providers: [
      {
        provide: SetNotificationPreferenceUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return preference;
          },
        },
      },
      {
        provide: GetNotificationPreferenceUseCase,
        useValue: { execute: async () => preference },
      },
      {
        provide: PrepareNotificationJobsUseCase,
        useValue: { execute: async () => [job] },
      },
      {
        provide: ClaimNotificationJobsUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return [job];
          },
        },
      },
      {
        provide: RecordNotificationDeliveryUseCase,
        useValue: { execute: async () => ({}) },
      },
      {
        provide: RegisterNotificationDestinationUseCase,
        useValue: { execute: async () => ({}) },
      },
      {
        provide: ListNotificationDestinationsUseCase,
        useValue: { execute: async () => [] },
      },
      {
        provide: ChangeNotificationDestinationStatusUseCase,
        useValue: { execute: async () => ({}) },
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
