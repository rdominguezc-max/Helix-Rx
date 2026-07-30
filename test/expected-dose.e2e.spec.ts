import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedRequestContext } from '../src/modules/auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { GenerateExpectedDosesUseCase } from '../src/modules/medications/application/generate-expected-doses.use-case';
import { ListExpectedDosesUseCase } from '../src/modules/medications/application/list-expected-doses.use-case';
import { ExpectedDoseController } from '../src/modules/medications/http/expected-dose.controller';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const treatmentId = '44444444-4444-4444-8444-444444444444';
const windowStartsAt = '2026-07-30T00:00:00.000Z';
const windowEndsAt = '2026-07-31T23:59:59.999Z';

describe('Expected Dose API Boundary', () => {
  it('blocks expected doses when guards deny the request', async () => {
    const app = await createTestApp(false);

    await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/expected-doses`,
      )
      .query({ windowStartsAt, windowEndsAt })
      .expect(403);

    await app.close();
  });

  it('generates expected doses with authenticated tenant context', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .post(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/expected-doses/generate`,
      )
      .send({ windowStartsAt, windowEndsAt, missedGraceMinutes: 90 })
      .expect(201);

    expect(response.body).toMatchObject({
      treatmentId,
      timezone: 'America/Hermosillo',
      generatedCount: 1,
    });
    expect(commands[0]).toMatchObject({
      patientId,
      organizationId,
      treatmentId,
      actorUserId: userId,
      missedGraceMinutes: 90,
    });
    await app.close();
  });

  it('lists expected doses and parses query options', async () => {
    const commands: unknown[] = [];
    const app = await createTestApp(true, commands);

    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/expected-doses`,
      )
      .query({
        windowStartsAt,
        windowEndsAt,
        missedGraceMinutes: '120',
      })
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      patientId,
      organizationId,
      treatmentId,
      missedGraceMinutes: 120,
    });
    await app.close();
  });

  it('rejects a missing required window date', async () => {
    const app = await createTestApp(true);

    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/patients/${patientId}/treatments/${treatmentId}/expected-doses`,
      )
      .query({ windowStartsAt })
      .expect(400);

    expect(response.body.message).toContain('windowEndsAt is required');
    await app.close();
  });
});

async function createTestApp(
  allowGuards: boolean,
  commands: unknown[] = [],
): Promise<INestApplication> {
  const dose = {
    id: '55555555-5555-4555-8555-555555555555',
    patientTreatmentId: treatmentId,
    patientId,
    organizationId,
    scheduledFor: new Date('2026-07-30T14:00:00.000Z'),
    timezone: 'America/Hermosillo',
    status: 'scheduled',
    medicationDoseEventId: null,
    createdAt: new Date(windowStartsAt),
    updatedAt: new Date(windowStartsAt),
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [ExpectedDoseController],
    providers: [
      {
        provide: GenerateExpectedDosesUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return {
              treatmentId,
              timezone: 'America/Hermosillo',
              windowStartsAt: new Date(windowStartsAt),
              windowEndsAt: new Date(windowEndsAt),
              generatedCount: 1,
              expectedDoses: [dose],
            };
          },
        },
      },
      {
        provide: ListExpectedDosesUseCase,
        useValue: {
          execute: async (command: unknown) => {
            commands.push(command);
            return [dose];
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
