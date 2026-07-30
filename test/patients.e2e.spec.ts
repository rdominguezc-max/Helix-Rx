import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it } from 'vitest';
import { AuditService } from '../src/modules/audit/application/audit.service';
import { FirebaseBearerAuthGuard } from '../src/modules/auth/http/firebase-bearer-auth.guard';
import type { HttpRequestWithAuth } from '../src/modules/auth/http/authenticated-request-context';
import { PermissionsGuard } from '../src/modules/auth/http/permissions.guard';
import { AddCareRelationshipUseCase } from '../src/modules/patients/application/add-care-relationship.use-case';
import { AddConsentUseCase } from '../src/modules/patients/application/add-consent.use-case';
import { AddEmergencyContactUseCase } from '../src/modules/patients/application/add-emergency-contact.use-case';
import { FindPatientByIdUseCase } from '../src/modules/patients/application/find-patient-by-id.use-case';
import {
  actorUserId,
  buildCareRelationshipFixture,
  buildConsentFixture,
  buildEmergencyContactFixture,
  buildPatientFixture,
  organizationId,
  patientId,
} from '../src/modules/patients/application/patient.fixture';
import { ListCareRelationshipsUseCase } from '../src/modules/patients/application/list-care-relationships.use-case';
import { ListConsentsUseCase } from '../src/modules/patients/application/list-consents.use-case';
import { ListEmergencyContactsUseCase } from '../src/modules/patients/application/list-emergency-contacts.use-case';
import { RegisterPatientUseCase } from '../src/modules/patients/application/register-patient.use-case';
import { UpdatePatientProfileUseCase } from '../src/modules/patients/application/update-patient-profile.use-case';
import { PatientsController } from '../src/modules/patients/http/patients.controller';

describe('Patient API Boundary', () => {
  it('blocks patient routes when authentication guard denies the request', async () => {
    const app = await createPatientTestApp(false);

    await request(app.getHttpServer()).get('/api/v1/patients/test').expect(403);

    await app.close();
  });

  it('registers a patient when guards allow the request', async () => {
    const app = await createPatientTestApp(true);

    await request(app.getHttpServer())
      .post('/api/v1/patients')
      .send({
        firstName: 'Ana',
        lastName: 'Lopez',
      })
      .expect(201);

    await app.close();
  });

  it('adds an emergency contact when guards allow the request', async () => {
    const app = await createPatientTestApp(true);

    await request(app.getHttpServer())
      .post(`/api/v1/patients/${patientId}/emergency-contacts`)
      .send({
        name: 'Maria Lopez',
        relationshipLabel: 'Madre',
        phone: '+526621234567',
      })
      .expect(201);

    await app.close();
  });
});

async function createPatientTestApp(allowGuards: boolean): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PatientsController],
    providers: [
      {
        provide: RegisterPatientUseCase,
        useValue: {
          execute: async () => buildPatientFixture(),
        },
      },
      {
        provide: FindPatientByIdUseCase,
        useValue: {
          execute: async () => buildPatientFixture(),
        },
      },
      {
        provide: UpdatePatientProfileUseCase,
        useValue: {
          execute: async () => buildPatientFixture(),
        },
      },
      {
        provide: AddCareRelationshipUseCase,
        useValue: {
          execute: async () => buildCareRelationshipFixture(),
        },
      },
      {
        provide: AddEmergencyContactUseCase,
        useValue: {
          execute: async () => buildEmergencyContactFixture(),
        },
      },
      {
        provide: AddConsentUseCase,
        useValue: {
          execute: async () => buildConsentFixture(),
        },
      },
      {
        provide: ListCareRelationshipsUseCase,
        useValue: {
          execute: async () => [buildCareRelationshipFixture()],
        },
      },
      {
        provide: ListEmergencyContactsUseCase,
        useValue: {
          execute: async () => [buildEmergencyContactFixture()],
        },
      },
      {
        provide: ListConsentsUseCase,
        useValue: {
          execute: async () => [buildConsentFixture()],
        },
      },
      {
        provide: AuditService,
        useValue: {
          recordEvent: async () => ({
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            actorUserId,
            organizationId,
            action: 'patient.test',
            resourceType: 'patient',
            resourceId: null,
            result: 'success',
            ipAddress: null,
            userAgent: null,
            metadata: {},
            createdAt: new Date(),
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
        if (!allowGuards) {
          return false;
        }

        const request = context.switchToHttp().getRequest();
        request.authenticatedUser = {
          userId: actorUserId,
          firebaseUid: 'firebase-user',
          email: 'clinician@example.com',
          emailVerified: true,
          organizationId,
        };

        return true;
      },
    })
    .overrideGuard(PermissionsGuard)
    .useValue({
      canActivate: () => allowGuards,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();

  return app;
}
