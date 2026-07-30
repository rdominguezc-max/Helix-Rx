import { describe, expect, it } from 'vitest';
import { AddCareRelationshipUseCase } from './add-care-relationship.use-case';
import { AddConsentUseCase } from './add-consent.use-case';
import { AddEmergencyContactUseCase } from './add-emergency-contact.use-case';
import { FindPatientByIdUseCase } from './find-patient-by-id.use-case';
import { ListCareRelationshipsUseCase } from './list-care-relationships.use-case';
import { ListConsentsUseCase } from './list-consents.use-case';
import { ListEmergencyContactsUseCase } from './list-emergency-contacts.use-case';
import {
  actorUserId,
  buildAuditServiceFixture,
  buildCareRelationshipFixture,
  buildConsentFixture,
  buildEmergencyContactFixture,
  buildPatientFixture,
  buildPatientRepositoryFixture,
  organizationId,
  patientId,
  relatedUserId,
  userId,
} from './patient.fixture';
import { RegisterPatientUseCase } from './register-patient.use-case';
import { UpdatePatientProfileUseCase } from './update-patient-profile.use-case';

describe('Patient Foundation use cases', () => {
  it('registers a patient, normalizes profile data, and records audit', async () => {
    const auditEvents: string[] = [];
    const repository = buildPatientRepositoryFixture({
      register: async (data) => {
        expect(data.organizationId).toBe(organizationId);
        expect(data.userId).toBe(userId);
        expect(data.profile.firstName).toBe('Ana Maria');
        expect(data.profile.lastName).toBe('Lopez');
        expect(data.profile.email).toBe('ana@example.com');
        expect(data.profile.language).toBe('es');
        expect(data.profile.timezone).toBe('America/Hermosillo');

        return {
          patient: buildPatientFixture({
            identity: {
              patientId,
              userId,
              externalReference: data.externalReference ?? null,
              createdAt: new Date(),
            },
          }),
          event: {
            name: 'PatientRegistered',
            patientId,
            organizationId,
            patientOrganizationMembershipId:
              '77777777-7777-4777-8777-777777777777',
            registeredBy: actorUserId,
            registeredAt: new Date(),
            hasLinkedUser: true,
          },
        };
      },
    });
    const auditService = buildAuditServiceFixture();
    auditService.recordEvent = async (event) => {
      auditEvents.push(event.action);

      return buildAuditServiceFixture().recordEvent(event);
    };
    const useCase = new RegisterPatientUseCase(repository, auditService);

    const patient = await useCase.execute({
      organizationId,
      userId,
      actorUserId,
      firstName: ' Ana   Maria ',
      lastName: ' Lopez ',
      email: ' ANA@EXAMPLE.COM ',
    });

    expect(patient.identity.userId).toBe(userId);
    expect(auditEvents).toEqual(['patient.create']);
  });

  it('rejects a patient registration with future birth date', async () => {
    const useCase = new RegisterPatientUseCase(
      buildPatientRepositoryFixture(),
      buildAuditServiceFixture(),
    );

    await expect(
      useCase.execute({
        organizationId,
        firstName: 'Ana',
        lastName: 'Lopez',
        birthDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    ).rejects.toThrow('birthDate cannot be in the future');
  });

  it('finds a patient by id', async () => {
    const useCase = new FindPatientByIdUseCase(
      buildPatientRepositoryFixture({
        findById: async (id) =>
          id === patientId ? buildPatientFixture({ id }) : null,
      }),
    );

    const patient = await useCase.execute(patientId);

    expect(patient?.id).toBe(patientId);
  });

  it('updates profile only when patient is active in organization', async () => {
    const auditEvents: string[] = [];
    const repository = buildPatientRepositoryFixture({
      updateProfile: async (data) =>
        buildPatientFixture({
          profile: {
            ...buildPatientFixture().profile,
            firstName: data.firstName,
            lastName: data.lastName,
          },
        }),
    });
    const auditService = buildAuditServiceFixture();
    auditService.recordEvent = async (event) => {
      auditEvents.push(event.action);

      return buildAuditServiceFixture().recordEvent(event);
    };
    const useCase = new UpdatePatientProfileUseCase(repository, auditService);

    const patient = await useCase.execute({
      patientId,
      organizationId,
      actorUserId,
      firstName: 'Ana',
      lastName: 'Lopez Actualizada',
    });

    expect(patient.profile.lastName).toBe('Lopez Actualizada');
    expect(auditEvents).toEqual(['patient.profile.update']);
  });

  it('rejects profile update when patient is not active in organization', async () => {
    const useCase = new UpdatePatientProfileUseCase(
      buildPatientRepositoryFixture({
        findActiveOrganizationMembership: async () => null,
      }),
      buildAuditServiceFixture(),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        firstName: 'Ana',
        lastName: 'Lopez',
      }),
    ).rejects.toThrow('patient is not active in organization');
  });

  it('adds an emergency contact and records audit', async () => {
    const auditEvents: string[] = [];
    const repository = buildPatientRepositoryFixture({
      addEmergencyContact: async (data) =>
        buildEmergencyContactFixture({
          name: data.name,
          canReceiveAlerts: data.canReceiveAlerts,
        }),
    });
    const auditService = buildAuditServiceFixture();
    auditService.recordEvent = async (event) => {
      auditEvents.push(event.action);

      return buildAuditServiceFixture().recordEvent(event);
    };
    const useCase = new AddEmergencyContactUseCase(
      repository,
      auditService,
    );

    const contact = await useCase.execute({
      patientId,
      organizationId,
      actorUserId,
      name: ' Maria Lopez ',
      relationshipLabel: 'Madre',
      phone: '+526621234567',
      canReceiveAlerts: true,
    });

    expect(contact.name).toBe('Maria Lopez');
    expect(contact.canReceiveAlerts).toBe(true);
    expect(auditEvents).toEqual(['patient.emergency_contact.create']);
  });

  it('adds a care relationship with normalized access scope', async () => {
    const auditEvents: string[] = [];
    const repository = buildPatientRepositoryFixture({
      addCareRelationship: async (data) =>
        buildCareRelationshipFixture({
          relatedUserId: data.relatedUserId,
          relationshipType: data.relationshipType,
          accessScope: data.accessScope,
        }),
    });
    const auditService = buildAuditServiceFixture();
    auditService.recordEvent = async (event) => {
      auditEvents.push(event.action);

      return buildAuditServiceFixture().recordEvent(event);
    };
    const useCase = new AddCareRelationshipUseCase(
      repository,
      auditService,
    );

    const relationship = await useCase.execute({
      patientId,
      organizationId,
      actorUserId,
      relatedUserId,
      relationshipType: 'caregiver',
      accessScope: [' profile.read ', 'profile.read', 'medications.read'],
    });

    expect(relationship.accessScope).toEqual([
      'profile.read',
      'medications.read',
    ]);
    expect(auditEvents).toEqual(['patient.care_relationship.create']);
  });

  it('adds consent with scope prepared for future authorization', async () => {
    const auditEvents: string[] = [];
    const repository = buildPatientRepositoryFixture({
      addConsent: async (data) =>
        buildConsentFixture({
          consentType: data.consentType,
          grantedToUserId: data.grantedToUserId ?? null,
          scope: data.scope,
        }),
    });
    const auditService = buildAuditServiceFixture();
    auditService.recordEvent = async (event) => {
      auditEvents.push(event.action);

      return buildAuditServiceFixture().recordEvent(event);
    };
    const useCase = new AddConsentUseCase(repository, auditService);

    const consent = await useCase.execute({
      patientId,
      organizationId,
      actorUserId,
      grantedToUserId: relatedUserId,
      consentType: ' caregiver_access ',
      scope: ['profile.read', 'crisis_events.read'],
    });

    expect(consent.consentType).toBe('caregiver_access');
    expect(consent.scope).toEqual(['profile.read', 'crisis_events.read']);
    expect(consent.grantedToUserId).toBe(relatedUserId);
    expect(auditEvents).toEqual(['patient.consent.create']);
  });

  it('lists patient care relationships for an active patient organization', async () => {
    const useCase = new ListCareRelationshipsUseCase(
      buildPatientRepositoryFixture(),
    );

    await expect(
      useCase.execute({ patientId, organizationId }),
    ).resolves.toHaveLength(1);
  });

  it('lists emergency contacts without granting clinical access', async () => {
    const useCase = new ListEmergencyContactsUseCase(
      buildPatientRepositoryFixture(),
    );

    const contacts = await useCase.execute({ patientId, organizationId });

    expect(contacts).toHaveLength(1);
    expect('accessScope' in contacts[0]).toBe(false);
  });

  it('lists patient consents for an active patient organization', async () => {
    const useCase = new ListConsentsUseCase(buildPatientRepositoryFixture());

    const consents = await useCase.execute({ patientId, organizationId });

    expect(consents[0].scope).toContain('profile.read');
  });
});
