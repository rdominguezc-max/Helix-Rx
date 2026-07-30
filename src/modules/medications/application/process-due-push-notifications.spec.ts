import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../domain/notification.entity';
import type { NotificationRepository } from '../domain/notification.repository';
import { ProcessDuePushNotificationsUseCase } from './process-due-push-notifications.use-case';
import type { SendPushNotificationUseCase } from './send-push-notification.use-case';

describe('ProcessDuePushNotificationsUseCase', () => {
  it('claims a bounded batch and summarizes delivery results', async () => {
    let claim: Record<string, unknown> | null = null;
    const jobs = [jobFixture('1'), jobFixture('2')];
    const repository = {
      claimDuePushJobs: async (data: Record<string, unknown>) => {
        claim = data;
        return jobs;
      },
    } as unknown as NotificationRepository;
    let deliveries = 0;
    const sender = {
      execute: async ({ job }: { job: NotificationJob }) => ({
        deliveryStatus: job.id.endsWith('1') ? 'accepted' : 'failed',
      }),
    } as SendPushNotificationUseCase;

    const result = await new ProcessDuePushNotificationsUseCase(
      repository,
      sender,
    ).execute({
      workerId: ' push-worker-1 ',
      asOf: new Date('2026-07-30T15:00:00Z'),
      limit: 2,
    });
    deliveries = result.accepted + result.failed;

    expect(claim).toMatchObject({
      workerId: 'push-worker-1',
      limit: 2,
      leaseSeconds: 300,
    });
    expect(result).toEqual({ claimed: 2, accepted: 1, failed: 1 });
    expect(deliveries).toBe(2);
  });
});

function jobFixture(suffix: string): NotificationJob {
  return {
    id: `11111111-1111-4111-8111-11111111111${suffix}`,
    patientId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    expectedDoseId: '44444444-4444-4444-8444-444444444444',
    jobType: 'dose_reminder',
    channel: 'push',
    destinationId: '55555555-5555-4555-8555-555555555555',
    destinationReference: `destination-${suffix}`,
    destinationMaskedLabel: `device …${suffix}`,
    scheduledFor: new Date(),
    status: 'processing',
    claimToken: '66666666-6666-4666-8666-666666666666',
    claimedBy: 'worker',
    claimedAt: new Date(),
    leaseExpiresAt: new Date(),
    attemptCount: 1,
    maxAttempts: 5,
    nextAttemptAt: new Date(),
    exhaustedAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
