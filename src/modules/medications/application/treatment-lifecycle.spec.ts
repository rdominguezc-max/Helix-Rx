import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type {
  MedicationDoseEvent,
  TreatmentStatusEvent,
} from '../domain/treatment-lifecycle.entity';
import type {
  ChangeTreatmentStatusData,
  RecordDoseEventData,
  TreatmentInsightSource,
  TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';
import { ChangeTreatmentStatusUseCase } from './change-treatment-status.use-case';
import { GetTreatmentInsightUseCase } from './get-treatment-insight.use-case';
import { ListDoseEventsUseCase } from './list-dose-events.use-case';
import { RecordDoseEventUseCase } from './record-dose-event.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const treatmentId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';
const eventId = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-07-30T15:00:00.000Z');

class LifecycleRepositoryFixture implements TreatmentLifecycleRepository {
  status: ChangeTreatmentStatusData['newStatus'] = 'active';
  doseEvents: MedicationDoseEvent[] = [];
  insightSource: TreatmentInsightSource = {
    patientId,
    organizationId,
    treatmentId,
    treatmentStatus: 'active',
    doseAmount: 1500,
    doseUnit: 'mg',
    frequencyIntervalHours: 12,
    administrationTimesCount: 2,
    isAsNeeded: false,
    doseSummaries: [
      { eventStatus: 'confirmed', timingStatus: 'on_time', count: 7 },
      { eventStatus: 'confirmed', timingStatus: 'late', count: 1 },
      { eventStatus: 'omitted', timingStatus: null, count: 2 },
      { eventStatus: 'cancelled', timingStatus: null, count: 1 },
    ],
    inventoryLots: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        quantityRemaining: 15,
        strengthAmount: 1000,
        expiresOn: new Date('2026-08-15T00:00:00.000Z'),
      },
    ],
  };

  async changeStatus(
    data: ChangeTreatmentStatusData,
  ): Promise<TreatmentStatusEvent> {
    const previousStatus = this.status;
    this.status = data.newStatus;
    return {
      id: '66666666-6666-4666-8666-666666666666',
      patientTreatmentId: data.treatmentId,
      previousStatus,
      newStatus: data.newStatus,
      reason: data.reason ?? null,
      changedBy: data.changedBy ?? null,
      changedAt: now,
    };
  }

  async recordDoseEvent(
    data: RecordDoseEventData,
  ): Promise<MedicationDoseEvent> {
    const existing = this.doseEvents.find(
      (event) => event.idempotencyKey === data.idempotencyKey,
    );
    if (existing) return existing;

    const event: MedicationDoseEvent = {
      id: eventId,
      patientTreatmentId: data.treatmentId,
      patientId: data.patientId,
      organizationId: data.organizationId,
      scheduledFor: data.scheduledFor,
      eventStatus: data.eventStatus,
      occurredAt: data.occurredAt ?? null,
      timingStatus: data.eventStatus === 'confirmed' ? 'on_time' : null,
      prescribedDoseAmount: 1500,
      prescribedDoseUnit: 'mg',
      omissionReason: data.omissionReason ?? null,
      idempotencyKey: data.idempotencyKey,
      recordedBy: data.recordedBy ?? null,
      createdAt: now,
      updatedAt: now,
      allocations:
        data.eventStatus === 'confirmed'
          ? [
              {
                id: '77777777-7777-4777-8777-777777777777',
                medicationDoseEventId: eventId,
                inventoryLotId: '88888888-8888-4888-8888-888888888888',
                inventoryMovementId: '99999999-9999-4999-8999-999999999999',
                prescribedAmountCovered: 1500,
                administrationUnitsConsumed: 1.5,
                createdAt: now,
              },
            ]
          : [],
    };
    this.doseEvents.push(event);
    return event;
  }

  async listDoseEvents(): Promise<MedicationDoseEvent[]> {
    return this.doseEvents;
  }

  async getTreatmentInsightSource(): Promise<TreatmentInsightSource> {
    return this.insightSource;
  }
}

function auditFixture(actions: string[]): AuditService {
  return {
    recordEvent: async (event) => {
      actions.push(event.action);
      return {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        actorUserId: event.actorUserId ?? null,
        organizationId: event.organizationId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? null,
        result: event.result,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        metadata: event.metadata ?? {},
        createdAt: now,
      };
    },
  } as AuditService;
}

describe('Treatment lifecycle', () => {
  it('pauses an active treatment and records an audit event', async () => {
    const repository = new LifecycleRepositoryFixture();
    const actions: string[] = [];
    const useCase = new ChangeTreatmentStatusUseCase(
      repository,
      auditFixture(actions),
    );

    const event = await useCase.execute({
      patientId,
      organizationId,
      treatmentId,
      newStatus: 'paused',
      actorUserId: userId,
    });

    expect(event).toMatchObject({
      previousStatus: 'active',
      newStatus: 'paused',
      changedBy: userId,
    });
    expect(actions).toEqual(['patient.treatment.status_change']);
  });

  it('requires a reason to discontinue a treatment', async () => {
    const useCase = new ChangeTreatmentStatusUseCase(
      new LifecycleRepositoryFixture(),
      auditFixture([]),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        treatmentId,
        newStatus: 'discontinued',
      }),
    ).rejects.toThrow('reason is required');
  });

  it('confirms a dose, returns its allocation and records audit', async () => {
    const repository = new LifecycleRepositoryFixture();
    const actions: string[] = [];
    const useCase = new RecordDoseEventUseCase(
      repository,
      auditFixture(actions),
    );

    const event = await useCase.execute({
      patientId,
      organizationId,
      treatmentId,
      scheduledFor: now,
      occurredAt: now,
      eventStatus: 'confirmed',
      idempotencyKey: 'dose-2026-07-30-1500',
      actorUserId: userId,
    });

    expect(event.allocations).toHaveLength(1);
    expect(event.allocations[0]).toMatchObject({
      prescribedAmountCovered: 1500,
      administrationUnitsConsumed: 1.5,
    });
    expect(actions).toEqual(['patient.dose.confirmed']);
  });

  it('requires occurredAt for confirmed doses', async () => {
    const useCase = new RecordDoseEventUseCase(
      new LifecycleRepositoryFixture(),
      auditFixture([]),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        treatmentId,
        scheduledFor: now,
        eventStatus: 'confirmed',
        idempotencyKey: 'missing-time',
      }),
    ).rejects.toThrow('occurredAt is required');
  });

  it('requires a reason for omitted doses', async () => {
    const useCase = new RecordDoseEventUseCase(
      new LifecycleRepositoryFixture(),
      auditFixture([]),
    );

    await expect(
      useCase.execute({
        patientId,
        organizationId,
        treatmentId,
        scheduledFor: now,
        eventStatus: 'omitted',
        idempotencyKey: 'missing-reason',
      }),
    ).rejects.toThrow('omissionReason is required');
  });

  it('returns the same event when a dose is retried idempotently', async () => {
    const repository = new LifecycleRepositoryFixture();
    const useCase = new RecordDoseEventUseCase(repository, auditFixture([]));
    const command = {
      patientId,
      organizationId,
      treatmentId,
      scheduledFor: now,
      occurredAt: now,
      eventStatus: 'confirmed' as const,
      idempotencyKey: 'retry-safe-dose',
    };

    const first = await useCase.execute(command);
    const second = await useCase.execute(command);

    expect(second.id).toBe(first.id);
    expect(repository.doseEvents).toHaveLength(1);
  });

  it('lists dose events for the requested treatment', async () => {
    const repository = new LifecycleRepositoryFixture();
    await repository.recordDoseEvent({
      patientId,
      organizationId,
      treatmentId,
      scheduledFor: now,
      eventStatus: 'cancelled',
      idempotencyKey: 'cancelled-dose',
    });

    const events = await new ListDoseEventsUseCase(repository).execute(
      patientId,
      organizationId,
      treatmentId,
    );

    expect(events).toHaveLength(1);
    expect(events[0].eventStatus).toBe('cancelled');
  });
});

describe('Treatment inventory risk and adherence insight', () => {
  it('calculates recorded adherence and punctuality rates', async () => {
    const insight = await new GetTreatmentInsightUseCase(
      new LifecycleRepositoryFixture(),
    ).execute({
      patientId,
      organizationId,
      treatmentId,
      asOf: now,
    });

    expect(insight.adherence).toMatchObject({
      recordedEvents: 11,
      confirmedDoses: 8,
      omittedDoses: 2,
      cancelledDoses: 1,
      adherenceRate: 0.8,
      onTimeDoses: 7,
      punctualityRate: 0.875,
    });
  });

  it('projects coverage from compatible inventory and flags low stock', async () => {
    const insight = await new GetTreatmentInsightUseCase(
      new LifecycleRepositoryFixture(),
    ).execute({
      patientId,
      organizationId,
      treatmentId,
      asOf: now,
    });

    expect(insight.inventory).toMatchObject({
      totalAdministrationUnits: 15,
      prescribedDoseCoverage: 15000,
      estimatedDosesRemaining: 10,
      expectedDosesPerDay: 2,
      estimatedDaysRemaining: 5,
      riskLevel: 'medium',
    });
    expect(insight.inventory.estimatedDepletionAt?.toISOString()).toBe(
      '2026-08-04T15:00:00.000Z',
    );
    expect(insight.alerts.map((alert) => alert.type)).toEqual([
      'inventory_low',
      'inventory_expiring',
    ]);
  });

  it('reports critical risk when compatible inventory is depleted', async () => {
    const repository = new LifecycleRepositoryFixture();
    repository.insightSource = {
      ...repository.insightSource,
      inventoryLots: [],
    };

    const insight = await new GetTreatmentInsightUseCase(repository).execute({
      patientId,
      organizationId,
      treatmentId,
      asOf: now,
    });

    expect(insight.inventory.riskLevel).toBe('critical');
    expect(insight.alerts[0].type).toBe('inventory_depleted');
  });

  it('does not invent daily coverage for PRN treatments', async () => {
    const repository = new LifecycleRepositoryFixture();
    repository.insightSource = {
      ...repository.insightSource,
      isAsNeeded: true,
      frequencyIntervalHours: null,
      administrationTimesCount: 0,
    };

    const insight = await new GetTreatmentInsightUseCase(repository).execute({
      patientId,
      organizationId,
      treatmentId,
      asOf: now,
    });

    expect(insight.inventory.expectedDosesPerDay).toBeNull();
    expect(insight.inventory.estimatedDaysRemaining).toBeNull();
    expect(insight.inventory.riskLevel).toBe('unknown');
  });

  it('rejects insight windows outside the supported range', async () => {
    await expect(
      new GetTreatmentInsightUseCase(
        new LifecycleRepositoryFixture(),
      ).execute({
        patientId,
        organizationId,
        treatmentId,
        windowDays: 0,
      }),
    ).rejects.toThrow('windowDays must be an integer between 1 and 365');
  });
});
