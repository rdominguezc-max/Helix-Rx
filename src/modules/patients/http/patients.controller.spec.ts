import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type { AddCareRelationshipUseCase } from '../application/add-care-relationship.use-case';
import type { AddConsentUseCase } from '../application/add-consent.use-case';
import type { AddEmergencyContactUseCase } from '../application/add-emergency-contact.use-case';
import type { FindPatientByIdUseCase } from '../application/find-patient-by-id.use-case';
import {
  actorUserId,
  buildCareRelationshipFixture,
  buildConsentFixture,
  buildEmergencyContactFixture,
  buildPatientFixture,
  organizationId,
  patientId,
} from '../application/patient.fixture';
import type { ListCareRelationshipsUseCase } from '../application/list-care-relationships.use-case';
import type { ListConsentsUseCase } from '../application/list-consents.use-case';
import type { ListEmergencyContactsUseCase } from '../application/list-emergency-contacts.use-case';
import type { RegisterPatientUseCase } from '../application/register-patient.use-case';
import type { UpdatePatientProfileUseCase } from '../application/update-patient-profile.use-case';
import { PatientsController } from './patients.controller';

const authenticatedUser = {
  userId: actorUserId,
  firebaseUid: 'firebase-user',
  email: 'clinician@example.com',
  emailVerified: true,
  organizationId,
};

const request = {
  headers: {},
};

function buildController(overrides: {
  register?: Partial<RegisterPatientUseCase>;
  find?: Partial<FindPatientByIdUseCase>;
  update?: Partial<UpdatePatientProfileUseCase>;
  addCareRelationship?: Partial<AddCareRelationshipUseCase>;
  addEmergencyContact?: Partial<AddEmergencyContactUseCase>;
  addConsent?: Partial<AddConsentUseCase>;
  listCareRelationships?: Partial<ListCareRelationshipsUseCase>;
  listEmergencyContacts?: Partial<ListEmergencyContactsUseCase>;
  listConsents?: Partial<ListConsentsUseCase>;
  audit?: Partial<AuditService>;
} = {}): PatientsController {
  return new PatientsController(
    {
      execute: async () => buildPatientFixture(),
      ...overrides.register,
    } as unknown as RegisterPatientUseCase,
    {
      execute: async () => buildPatientFixture(),
      ...overrides.find,
    } as unknown as FindPatientByIdUseCase,
    {
      execute: async () => buildPatientFixture(),
      ...overrides.update,
    } as unknown as UpdatePatientProfileUseCase,
    {
      execute: async () => buildCareRelationshipFixture(),
      ...overrides.addCareRelationship,
    } as unknown as AddCareRelationshipUseCase,
    {
      execute: async () => buildEmergencyContactFixture(),
      ...overrides.addEmergencyContact,
    } as unknown as AddEmergencyContactUseCase,
    {
      execute: async () => buildConsentFixture(),
      ...overrides.addConsent,
    } as unknown as AddConsentUseCase,
    {
      execute: async () => [buildCareRelationshipFixture()],
      ...overrides.listCareRelationships,
    } as unknown as ListCareRelationshipsUseCase,
    {
      execute: async () => [buildEmergencyContactFixture()],
      ...overrides.listEmergencyContacts,
    } as unknown as ListEmergencyContactsUseCase,
    {
      execute: async () => [buildConsentFixture()],
      ...overrides.listConsents,
    } as unknown as ListConsentsUseCase,
    {
      recordEvent: async () =>
        ({
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          actorUserId,
          organizationId,
          action: 'patient.read',
          resourceType: 'patient',
          resourceId: patientId,
          result: 'success',
          ipAddress: null,
          userAgent: null,
          metadata: {},
          createdAt: new Date(),
        }) as Awaited<ReturnType<AuditService['recordEvent']>>,
      ...overrides.audit,
    } as unknown as AuditService,
  );
}

describe('PatientsController', () => {
  it('registers a patient using authenticated organization context', async () => {
    const controller = buildController({
      register: {
        execute: async (command) => {
          expect(command.organizationId).toBe(organizationId);
          expect(command.actorUserId).toBe(actorUserId);
          expect(command.firstName).toBe('Ana');

          return buildPatientFixture();
        },
      },
    });

    await expect(
      controller.registerPatient(
        {
          firstName: 'Ana',
          lastName: 'Lopez',
        },
        authenticatedUser,
        request,
      ),
    ).resolves.toMatchObject({ id: patientId });
  });

  it('audits successful patient reads', async () => {
    const auditActions: string[] = [];
    const controller = buildController({
      audit: {
        recordEvent: async (event) => {
          auditActions.push(event.action);

          return {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            actorUserId,
            organizationId,
            action: event.action,
            resourceType: event.resourceType,
            resourceId: event.resourceId ?? null,
            result: event.result,
            ipAddress: null,
            userAgent: null,
            metadata: {},
            createdAt: new Date(),
          };
        },
      },
    });

    await controller.findPatient(patientId, authenticatedUser, request);

    expect(auditActions).toEqual(['patient.read']);
  });

  it('returns not found when patient does not exist', async () => {
    const controller = buildController({
      find: {
        execute: async () => null,
      },
    });

    await expect(
      controller.findPatient(patientId, authenticatedUser, request),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates patient profile using patient id and organization context', async () => {
    const controller = buildController({
      update: {
        execute: async (command) => {
          expect(command.patientId).toBe(patientId);
          expect(command.organizationId).toBe(organizationId);
          expect(command.lastName).toBe('Lopez Actualizada');

          return buildPatientFixture({
            profile: {
              ...buildPatientFixture().profile,
              lastName: command.lastName,
            },
          });
        },
      },
    });

    const patient = await controller.updatePatientProfile(
      patientId,
      {
        firstName: 'Ana',
        lastName: 'Lopez Actualizada',
      },
      authenticatedUser,
      request,
    );

    expect(patient.profile.lastName).toBe('Lopez Actualizada');
  });

  it('adds a care relationship', async () => {
    const controller = buildController({
      addCareRelationship: {
        execute: async (command) => {
          expect(command.patientId).toBe(patientId);
          expect(command.organizationId).toBe(organizationId);
          expect(command.relatedUserId).toBe(
            '55555555-5555-4555-8555-555555555555',
          );

          return buildCareRelationshipFixture();
        },
      },
    });

    await expect(
      controller.addCareRelationship(
        patientId,
        {
          relatedUserId: '55555555-5555-4555-8555-555555555555',
          relationshipType: 'caregiver',
          accessScope: ['profile.read'],
        },
        authenticatedUser,
        request,
      ),
    ).resolves.toMatchObject({ relationshipType: 'caregiver' });
  });

  it('adds an emergency contact without granting clinical access', async () => {
    const controller = buildController();

    const contact = await controller.addEmergencyContact(
      patientId,
      {
        name: 'Maria Lopez',
        relationshipLabel: 'Madre',
        phone: '+526621234567',
        canReceiveAlerts: true,
      },
      authenticatedUser,
      request,
    );

    expect(contact.canReceiveAlerts).toBe(true);
    expect('accessScope' in contact).toBe(false);
  });

  it('adds consent with scope and validity dates', async () => {
    const controller = buildController({
      addConsent: {
        execute: async (command) => {
          expect(command.scope).toEqual(['profile.read']);
          expect(command.effectiveTo).toBeInstanceOf(Date);

          return buildConsentFixture({ scope: command.scope });
        },
      },
    });

    const consent = await controller.addConsent(
      patientId,
      {
        consentType: 'caregiver_access',
        scope: ['profile.read'],
        effectiveTo: '2030-01-01T00:00:00.000Z',
      },
      authenticatedUser,
      request,
    );

    expect(consent.scope).toEqual(['profile.read']);
  });

  it('audits relationship, contact and consent reads', async () => {
    const auditActions: string[] = [];
    const controller = buildController({
      audit: {
        recordEvent: async (event) => {
          auditActions.push(event.action);

          return {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            actorUserId,
            organizationId,
            action: event.action,
            resourceType: event.resourceType,
            resourceId: event.resourceId ?? null,
            result: event.result,
            ipAddress: null,
            userAgent: null,
            metadata: {},
            createdAt: new Date(),
          };
        },
      },
    });

    await controller.listCareRelationships(patientId, authenticatedUser, request);
    await controller.listEmergencyContacts(patientId, authenticatedUser, request);
    await controller.listConsents(patientId, authenticatedUser, request);

    expect(auditActions).toEqual([
      'patient.care_relationship.read',
      'patient.emergency_contact.read',
      'patient.consent.read',
    ]);
  });
});
