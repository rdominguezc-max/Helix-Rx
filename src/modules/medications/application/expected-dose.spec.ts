import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type {
  ExpectedDose,
  ExpectedDoseGenerationResult,
} from '../domain/expected-dose.entity';
import type {
  ExpectedDoseRepository,
  GenerateExpectedDosesData,
  ListExpectedDosesData,
} from '../domain/expected-dose.repository';
import { GenerateExpectedDosesUseCase } from './generate-expected-doses.use-case';
import { ListExpectedDosesUseCase } from './list-expected-doses.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const treatmentId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';
const windowStartsAt = new Date('2026-07-30T00:00:00.000Z');
const windowEndsAt = new Date('2026-07-31T23:59:59.999Z');
const asOf = new Date('2026-07-31T12:00:00.000Z');

function expectedDoseFixture(): ExpectedDose {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    patientTreatmentId: treatmentId,
    patientId,
    organizationId,
    scheduledFor: new Date('2026-07-30T14:00:00.000Z'),
    timezone: 'America/Hermosillo',
    status: 'scheduled',
    medicationDoseEventId: null,
    createdAt: asOf,
    updatedAt: asOf,
  };
}

class ExpectedDoseRepositoryFixture implements ExpectedDoseRepository {
  generatedData: GenerateExpectedDosesData | null = null;
  listedData: ListExpectedDosesData | null = null;
  doses: ExpectedDose[] = [expectedDoseFixture()];

  async generate(
    data: GenerateExpectedDosesData,
  ): Promise<ExpectedDoseGenerationResult> {
    this.generatedData = data;
    return {
      treatmentId,
      timezone: 'America/Hermosillo',
      windowStartsAt: data.windowStartsAt,
      windowEndsAt: data.windowEndsAt,
      generatedCount: this.doses.length,
      expectedDoses: this.doses,
    };
  }

  async list(data: ListExpectedDosesData): Promise<ExpectedDose[]> {
    this.listedData = data;
    return this.doses;
  }
}

function auditFixture(actions: string[]): AuditService {
  return {
    recordEvent: async (event) => {
      actions.push(event.action);
      return {
        id: '66666666-6666-4666-8666-666666666666',
        actorUserId: event.actorUserId ?? null,
        organizationId: event.organizationId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? null,
        result: event.result,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        metadata: event.metadata ?? {},
        createdAt: asOf,
      };
    },
  } as AuditService;
}

describe('Expected dose scheduling', () => {
  it('generates an idempotent scheduling window and records audit', async () => {
    const repository = new ExpectedDoseRepositoryFixture();
    const actions: string[] = [];

    const result = await new GenerateExpectedDosesUseCase(
      repository,
      auditFixture(actions),
    ).execute({
      patientId,
      organizationId,
      treatmentId,
      windowStartsAt,
      windowEndsAt,
      asOf,
      actorUserId: userId,
    });

    expect(result.generatedCount).toBe(1);
    expect(repository.generatedData).toMatchObject({
      patientId,
      organizationId,
      treatmentId,
      missedGraceMinutes: 60,
    });
    expect(actions).toEqual(['patient.treatment.expected_doses.generate']);
  });

  it('lists expected doses with a configurable missed grace period', async () => {
    const repository = new ExpectedDoseRepositoryFixture();

    const doses = await new ListExpectedDosesUseCase(repository).execute({
      patientId,
      organizationId,
      treatmentId,
      windowStartsAt,
      windowEndsAt,
      asOf,
      missedGraceMinutes: 90,
    });

    expect(doses).toHaveLength(1);
    expect(repository.listedData?.missedGraceMinutes).toBe(90);
  });

  it('rejects generation windows longer than 90 days', async () => {
    await expect(
      new GenerateExpectedDosesUseCase(
        new ExpectedDoseRepositoryFixture(),
        auditFixture([]),
      ).execute({
        patientId,
        organizationId,
        treatmentId,
        windowStartsAt,
        windowEndsAt: new Date('2026-11-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('expected dose window cannot exceed 90 days');
  });

  it('rejects an inverted scheduling window', async () => {
    expect(() =>
      new ListExpectedDosesUseCase(
        new ExpectedDoseRepositoryFixture(),
      ).execute({
        patientId,
        organizationId,
        treatmentId,
        windowStartsAt: windowEndsAt,
        windowEndsAt: windowStartsAt,
      }),
    ).toThrow('windowEndsAt cannot be before windowStartsAt');
  });

  it('rejects grace periods outside one day', async () => {
    expect(() =>
      new ListExpectedDosesUseCase(
        new ExpectedDoseRepositoryFixture(),
      ).execute({
        patientId,
        organizationId,
        treatmentId,
        windowStartsAt,
        windowEndsAt,
        missedGraceMinutes: 1441,
      }),
    ).toThrow(
      'missedGraceMinutes must be an integer between 0 and 1440',
    );
  });
});
