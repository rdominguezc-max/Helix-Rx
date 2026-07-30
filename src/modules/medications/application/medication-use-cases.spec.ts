import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type {
  Medication,
  MedicationPresentation,
  PatientTreatment,
} from '../domain/medication.entity';
import type {
  CreateMedicationData,
  CreatePresentationData,
  CreateTreatmentData,
  MedicationRepository,
} from '../domain/medication.repository';
import { CreateMedicationUseCase } from './create-medication.use-case';
import { CreatePresentationUseCase } from './create-presentation.use-case';
import { CreateTreatmentUseCase } from './create-treatment.use-case';
import { ListPatientTreatmentsUseCase } from './list-patient-treatments.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const patientId = '33333333-3333-4333-8333-333333333333';
const medicationId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-07-30T00:00:00.000Z');

function medicationFixture(): Medication {
  return {
    id: medicationId,
    organizationId,
    genericName: 'Levetiracetam',
    activeIngredient: 'Levetiracetam',
    medicationForm: 'tablet',
    route: 'oral',
    status: 'active',
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function presentationFixture(): MedicationPresentation {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    medicationId,
    brandName: null,
    manufacturer: null,
    strengthAmount: 1000,
    strengthUnit: 'mg',
    administrationUnit: 'tablet',
    packageQuantity: 30,
    countryCode: 'MX',
    status: 'active',
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function treatmentFixture(): PatientTreatment {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    patientId,
    organizationId,
    medicationId,
    prescribedBy: userId,
    doseAmount: 1500,
    doseUnit: 'mg',
    frequencyIntervalHours: 12,
    administrationTimes: ['07:00', '19:00'],
    instructions: null,
    startsOn: now,
    endsOn: null,
    isAsNeeded: false,
    status: 'active',
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

class InMemoryMedicationRepository implements MedicationRepository {
  hasMembership = true;
  medication: Medication | null = medicationFixture();
  treatments: PatientTreatment[] = [];

  async createMedication(data: CreateMedicationData): Promise<Medication> {
    this.medication = { ...medicationFixture(), ...data };
    return this.medication;
  }

  async listMedications(): Promise<Medication[]> {
    return this.medication ? [this.medication] : [];
  }

  async findMedication(): Promise<Medication | null> {
    return this.medication;
  }

  async createPresentation(
    data: CreatePresentationData,
  ): Promise<MedicationPresentation> {
    return { ...presentationFixture(), ...data };
  }

  async listPresentations(): Promise<MedicationPresentation[]> {
    return [presentationFixture()];
  }

  async patientHasActiveMembership(): Promise<boolean> {
    return this.hasMembership;
  }

  async createTreatment(data: CreateTreatmentData): Promise<PatientTreatment> {
    const treatment = { ...treatmentFixture(), ...data };
    this.treatments.push(treatment);
    return treatment;
  }

  async listPatientTreatments(): Promise<PatientTreatment[]> {
    return this.treatments;
  }
}

function auditFixture(actions: string[]): AuditService {
  return {
    recordEvent: async (event) => {
      actions.push(event.action);
      return {
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
      };
    },
  } as AuditService;
}

describe('Medication use cases', () => {
  it('normalizes and creates a medication with audit', async () => {
    const repository = new InMemoryMedicationRepository();
    const actions: string[] = [];
    const useCase = new CreateMedicationUseCase(
      repository,
      auditFixture(actions),
    );

    const result = await useCase.execute({
      organizationId,
      actorUserId: userId,
      genericName: '  Levetiracetam ',
      activeIngredient: 'Levetiracetam',
      medicationForm: 'tablet',
      route: 'oral',
    });

    expect(result.genericName).toBe('Levetiracetam');
    expect(actions).toEqual(['medication.create']);
  });

  it('creates a commercial presentation separately from prescription', async () => {
    const repository = new InMemoryMedicationRepository();
    const useCase = new CreatePresentationUseCase(
      repository,
      auditFixture([]),
    );

    const result = await useCase.execute({
      organizationId,
      medicationId,
      actorUserId: userId,
      strengthAmount: 1000,
      strengthUnit: 'mg',
      administrationUnit: 'tablet',
      packageQuantity: 30,
    });

    expect(result).toMatchObject({
      medicationId,
      strengthAmount: 1000,
      packageQuantity: 30,
    });
  });

  it('creates a scheduled treatment and normalizes administration times', async () => {
    const repository = new InMemoryMedicationRepository();
    const actions: string[] = [];
    const useCase = new CreateTreatmentUseCase(
      repository,
      auditFixture(actions),
    );

    const result = await useCase.execute({
      patientId,
      organizationId,
      medicationId,
      actorUserId: userId,
      doseAmount: 1500,
      doseUnit: 'mg',
      administrationTimes: ['19:00', '07:00', '07:00'],
      startsOn: now,
    });

    expect(result.administrationTimes).toEqual(['07:00', '19:00']);
    expect(actions).toEqual(['patient.treatment.create']);
  });

  it('rejects a treatment without schedule or PRN indication', async () => {
    const useCase = new CreateTreatmentUseCase(
      new InMemoryMedicationRepository(),
      auditFixture([]),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        medicationId,
        doseAmount: 500,
        doseUnit: 'mg',
        startsOn: now,
      }),
    ).rejects.toThrow('treatment requires');
  });

  it('rejects treatment when patient is outside the organization', async () => {
    const repository = new InMemoryMedicationRepository();
    repository.hasMembership = false;
    const useCase = new CreateTreatmentUseCase(
      repository,
      auditFixture([]),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        medicationId,
        doseAmount: 500,
        doseUnit: 'mg',
        frequencyIntervalHours: 12,
        startsOn: now,
      }),
    ).rejects.toThrow('patient is not active in organization');
  });

  it('protects treatment lists with patient organization membership', async () => {
    const repository = new InMemoryMedicationRepository();
    repository.hasMembership = false;
    const useCase = new ListPatientTreatmentsUseCase(repository);

    await expect(useCase.execute(patientId, organizationId)).rejects.toThrow(
      'patient is not active in organization',
    );
  });
});
