import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationDeliveryEvent,
  NotificationJob,
} from '../domain/notification.entity';
import {
  PUSH_NOTIFICATION_PROVIDER,
  type PushNotificationProvider,
} from '../domain/push-notification-provider';
import {
  NOTIFICATION_DESTINATION_RESOLVER,
  type NotificationDestinationResolver,
} from '../domain/notification-destination-resolver';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';

@Injectable()
export class SendPushNotificationUseCase {
  constructor(
    @Inject(PUSH_NOTIFICATION_PROVIDER)
    private readonly provider: PushNotificationProvider,
    @Inject(NOTIFICATION_DESTINATION_RESOLVER)
    private readonly destinationResolver: NotificationDestinationResolver,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  async execute(command: {
    job: NotificationJob;
  }): Promise<NotificationDeliveryEvent> {
    const { job } = command;
    if (job.channel !== 'push') throw new Error('notification job is not push');
    if (job.status !== 'processing' || !job.claimToken) {
      throw new Error('notification job claim is not active');
    }

    try {
      if (!job.destinationReference) {
        throw new Error('push destination reference is missing');
      }
      const destinationToken =
        await this.destinationResolver.resolvePushToken(
          job.destinationReference,
        );
      const result = await this.provider.send({
        destinationToken,
        title: 'Recordatorio de medicamento',
        body: 'Tienes una dosis programada.',
        data: {
          notificationJobId: job.id,
          type: job.jobType,
        },
      });
      return this.repository.recordDelivery({
        patientId: job.patientId,
        organizationId: job.organizationId,
        notificationJobId: job.id,
        claimToken: job.claimToken,
        provider: result.provider,
        deliveryStatus: 'accepted',
        providerMessageId: result.providerMessageId,
      });
    } catch (error) {
      const detail = this.safeErrorDetail(error);
      return this.repository.recordDelivery({
        patientId: job.patientId,
        organizationId: job.organizationId,
        notificationJobId: job.id,
        claimToken: job.claimToken,
        provider: 'firebase-cloud-messaging',
        deliveryStatus: 'failed',
        errorCode: this.errorCode(error),
        detail,
        retryAt: this.retryAt(job, error),
      });
    }
  }

  private retryAt(job: NotificationJob, error: unknown): Date | null {
    if (job.attemptCount >= job.maxAttempts || this.isPermanent(error)) {
      return null;
    }
    const delaySeconds = Math.min(
      3600,
      60 * 2 ** Math.max(0, job.attemptCount - 1),
    );
    return new Date(Date.now() + delaySeconds * 1000);
  }

  private isPermanent(error: unknown): boolean {
    const code = this.errorCode(error);
    return new Set([
      'messaging/invalid-argument',
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/mismatched-credential',
    ]).has(code);
  }

  private errorCode(error: unknown): string {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code.slice(0, 100);
    }
    return 'push/send-failed';
  }

  private safeErrorDetail(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Push delivery failed';
    return message.replace(/[A-Za-z0-9_-]{80,}/g, '[redacted]').slice(0, 500);
  }
}
