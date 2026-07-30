import { describe, expect, it } from 'vitest';
import type { AuditService } from '../../audit/application/audit.service';
import type {
  NotificationDeliveryEvent,
  NotificationJob,
  PatientNotificationPreference,
} from '../domain/notification.entity';
import type {
  ClaimNotificationJobsData,
  NotificationRepository,
  PrepareNotificationJobsData,
  RecordNotificationDeliveryData,
  SetNotificationPreferenceData,
} from '../domain/notification.repository';
import { ClaimNotificationJobsUseCase } from './claim-notification-jobs.use-case';
import { PrepareNotificationJobsUseCase } from './prepare-notification-jobs.use-case';
import { RecordNotificationDeliveryUseCase } from './record-notification-delivery.use-case';
import { SetNotificationPreferenceUseCase } from './set-notification-preference.use-case';

const organizationId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const jobId = '44444444-4444-4444-8444-444444444444';
const claimToken = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-07-30T15:00:00.000Z');

class NotificationRepositoryFixture implements NotificationRepository {
  preferenceData: SetNotificationPreferenceData | null = null;
  preparedData: PrepareNotificationJobsData | null = null;
  claimedData: ClaimNotificationJobsData | null = null;
  deliveryData: RecordNotificationDeliveryData | null = null;

  async setPreference(
    data: SetNotificationPreferenceData,
  ): Promise<PatientNotificationPreference> {
    this.preferenceData = data;
    return {
      id: '66666666-6666-4666-8666-666666666666',
      patientId,
      organizationId,
      enabledChannels: data.enabledChannels,
      reminderLeadMinutes: data.reminderLeadMinutes,
      status: data.status,
      updatedBy: data.updatedBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPreference(): Promise<PatientNotificationPreference | null> {
    return null;
  }

  async prepareJobs(data: PrepareNotificationJobsData): Promise<NotificationJob[]> {
    this.preparedData = data;
    return [jobFixture()];
  }

  async claimJobs(data: ClaimNotificationJobsData): Promise<NotificationJob[]> {
    this.claimedData = data;
    return [jobFixture({ status: 'processing', claimToken })];
  }

  async recordDelivery(
    data: RecordNotificationDeliveryData,
  ): Promise<NotificationDeliveryEvent> {
    this.deliveryData = data;
    return {
      id: '77777777-7777-4777-8777-777777777777',
      notificationJobId: data.notificationJobId,
      provider: data.provider,
      deliveryStatus: data.deliveryStatus,
      providerMessageId: data.providerMessageId ?? null,
      errorCode: data.errorCode ?? null,
      detail: data.detail ?? null,
      occurredAt: data.occurredAt ?? now,
      recordedAt: now,
    };
  }
}

function jobFixture(overrides: Partial<NotificationJob> = {}): NotificationJob {
  return {
    id: jobId,
    patientId,
    organizationId,
    expectedDoseId: '88888888-8888-4888-8888-888888888888',
    jobType: 'dose_reminder',
    channel: 'push',
    scheduledFor: now,
    status: 'pending',
    claimToken: null,
    claimedBy: null,
    claimedAt: null,
    leaseExpiresAt: null,
    attemptCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function auditFixture(actions: string[]): AuditService {
  return {
    recordEvent: async (event) => {
      actions.push(event.action);
      return {
        id: '99999999-9999-4999-8999-999999999999',
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

describe('Notification delivery foundation', () => {
  it('normalizes patient channels and audits preference changes', async () => {
    const repository = new NotificationRepositoryFixture();
    const actions: string[] = [];

    const preference = await new SetNotificationPreferenceUseCase(
      repository,
      auditFixture(actions),
    ).execute({
      patientId,
      organizationId,
      enabledChannels: ['sms', 'push', 'sms'],
      reminderLeadMinutes: 20,
      actorUserId: userId,
    });

    expect(preference.enabledChannels).toEqual(['push', 'sms']);
    expect(actions).toEqual(['patient.notification.preference.update']);
  });

  it('rejects invalid reminder lead time', async () => {
    await expect(
      new SetNotificationPreferenceUseCase(
        new NotificationRepositoryFixture(),
        auditFixture([]),
      ).execute({
        patientId,
        organizationId,
        enabledChannels: ['push'],
        reminderLeadMinutes: 1441,
      }),
    ).rejects.toThrow('reminderLeadMinutes must be an integer');
  });

  it('prepares a bounded reminder window', async () => {
    const repository = new NotificationRepositoryFixture();
    const windowEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const jobs = await new PrepareNotificationJobsUseCase(repository).execute({
      patientId,
      organizationId,
      windowStartsAt: now,
      windowEndsAt,
    });

    expect(jobs).toHaveLength(1);
    expect(repository.preparedData?.windowEndsAt).toEqual(windowEndsAt);
  });

  it('claims jobs with safe defaults and a worker lease', async () => {
    const repository = new NotificationRepositoryFixture();

    const jobs = await new ClaimNotificationJobsUseCase(repository).execute({
      patientId,
      organizationId,
      workerId: ' reminder-worker-1 ',
      asOf: now,
    });

    expect(jobs[0].status).toBe('processing');
    expect(repository.claimedData).toMatchObject({
      workerId: 'reminder-worker-1',
      limit: 25,
      leaseSeconds: 300,
    });
  });

  it('requires failure evidence for failed deliveries', () => {
    expect(() =>
      new RecordNotificationDeliveryUseCase(
        new NotificationRepositoryFixture(),
      ).execute({
        patientId,
        organizationId,
        notificationJobId: jobId,
        claimToken,
        provider: 'provider',
        deliveryStatus: 'failed',
      }),
    ).toThrow('failed delivery requires errorCode or detail');
  });

  it('records a provider-neutral delivery result', async () => {
    const repository = new NotificationRepositoryFixture();

    const delivery = await new RecordNotificationDeliveryUseCase(
      repository,
    ).execute({
      patientId,
      organizationId,
      notificationJobId: jobId,
      claimToken,
      provider: ' test-provider ',
      deliveryStatus: 'accepted',
      providerMessageId: 'message-1',
    });

    expect(delivery).toMatchObject({
      provider: 'test-provider',
      deliveryStatus: 'accepted',
    });
  });
});
