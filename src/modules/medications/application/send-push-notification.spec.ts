import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../domain/notification.entity';
import type { PushNotificationProvider } from '../domain/push-notification-provider';
import type { NotificationDestinationResolver } from '../domain/notification-destination-resolver';
import type {
  NotificationRepository,
  RecordNotificationDeliveryData,
} from '../domain/notification.repository';
import { SendPushNotificationUseCase } from './send-push-notification.use-case';

const job: NotificationJob = {
  id: '11111111-1111-4111-8111-111111111111',
  patientId: '22222222-2222-4222-8222-222222222222',
  organizationId: '33333333-3333-4333-8333-333333333333',
  expectedDoseId: '44444444-4444-4444-8444-444444444444',
  jobType: 'dose_reminder',
  channel: 'push',
  destinationId: '55555555-5555-4555-8555-555555555555',
  destinationReference: 'secret-reference',
  destinationMaskedLabel: 'device …1234',
  scheduledFor: new Date('2026-07-30T15:00:00Z'),
  status: 'processing',
  claimToken: '66666666-6666-4666-8666-666666666666',
  claimedBy: 'worker',
  claimedAt: new Date('2026-07-30T15:00:00Z'),
  leaseExpiresAt: new Date('2026-07-30T15:05:00Z'),
  attemptCount: 1,
  maxAttempts: 5,
  nextAttemptAt: new Date('2026-07-30T15:00:00Z'),
  exhaustedAt: null,
  lastError: null,
  createdAt: new Date('2026-07-30T14:00:00Z'),
  updatedAt: new Date('2026-07-30T15:00:00Z'),
};

describe('SendPushNotificationUseCase', () => {
  it('sends a minimal FCM message and records acceptance', async () => {
    const sent: unknown[] = [];
    const deliveries: RecordNotificationDeliveryData[] = [];
    const provider: PushNotificationProvider = {
      send: async (message) => {
        sent.push(message);
        return {
          provider: 'firebase-cloud-messaging',
          providerMessageId: 'projects/helix/messages/1',
        };
      },
    };
    const useCase = new SendPushNotificationUseCase(
      provider,
      resolverFixture(),
      repositoryFixture(deliveries),
    );

    await useCase.execute({ job });

    expect(sent[0]).toMatchObject({
      destinationToken: 'fcm-token',
      data: { notificationJobId: job.id, type: 'dose_reminder' },
    });
    expect(JSON.stringify(sent[0])).not.toContain(job.patientId);
    expect(deliveries[0]).toMatchObject({
      deliveryStatus: 'accepted',
      providerMessageId: 'projects/helix/messages/1',
    });
  });

  it('records a sanitized provider failure', async () => {
    const deliveries: RecordNotificationDeliveryData[] = [];
    const provider: PushNotificationProvider = {
      send: async () => {
        const error = new Error(`invalid token ${'a'.repeat(100)}`);
        Object.assign(error, { code: 'messaging/registration-token-not-registered' });
        throw error;
      },
    };

    await new SendPushNotificationUseCase(
      provider,
      resolverFixture(),
      repositoryFixture(deliveries),
    ).execute({ job });

    expect(deliveries[0]).toMatchObject({
      deliveryStatus: 'failed',
      errorCode: 'messaging/registration-token-not-registered',
      retryAt: null,
    });
    expect(deliveries[0].detail).toContain('[redacted]');
  });

  it('schedules exponential retry for a transient FCM failure', async () => {
    const deliveries: RecordNotificationDeliveryData[] = [];
    const provider: PushNotificationProvider = {
      send: async () => {
        const error = new Error('provider temporarily unavailable');
        Object.assign(error, { code: 'messaging/server-unavailable' });
        throw error;
      },
    };
    const before = Date.now();

    await new SendPushNotificationUseCase(
      provider,
      resolverFixture(),
      repositoryFixture(deliveries),
    ).execute({ job: { ...job, attemptCount: 2 } });

    expect(deliveries[0].retryAt?.getTime()).toBeGreaterThanOrEqual(
      before + 120_000,
    );
    expect(deliveries[0].retryAt?.getTime()).toBeLessThanOrEqual(
      Date.now() + 120_000,
    );
  });
});

function repositoryFixture(
  deliveries: RecordNotificationDeliveryData[],
): NotificationRepository {
  return {
    recordDelivery: async (data) => {
      deliveries.push(data);
      return {
        id: '77777777-7777-4777-8777-777777777777',
        notificationJobId: data.notificationJobId,
        provider: data.provider,
        deliveryStatus: data.deliveryStatus,
        providerMessageId: data.providerMessageId ?? null,
        errorCode: data.errorCode ?? null,
        detail: data.detail ?? null,
        occurredAt: new Date(),
        recordedAt: new Date(),
      };
    },
  } as NotificationRepository;
}

function resolverFixture(): NotificationDestinationResolver {
  return { resolvePushToken: async () => 'fcm-token' };
}
