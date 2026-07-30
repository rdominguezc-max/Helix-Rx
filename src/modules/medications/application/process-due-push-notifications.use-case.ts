import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import { SendPushNotificationUseCase } from './send-push-notification.use-case';

export interface ProcessDuePushResult {
  claimed: number;
  accepted: number;
  failed: number;
}

@Injectable()
export class ProcessDuePushNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
    private readonly sendPush: SendPushNotificationUseCase,
  ) {}

  async execute(command: {
    workerId: string;
    asOf?: Date;
    limit?: number;
    leaseSeconds?: number;
  }): Promise<ProcessDuePushResult> {
    const workerId = command.workerId?.trim();
    if (!workerId || workerId.length > 100) {
      throw new Error('workerId is required and must not exceed 100 characters');
    }
    const asOf = command.asOf ?? new Date();
    if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be valid');
    const limit = command.limit ?? 25;
    const leaseSeconds = command.leaseSeconds ?? 300;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100');
    }
    if (!Number.isInteger(leaseSeconds) || leaseSeconds < 30 || leaseSeconds > 3600) {
      throw new Error('leaseSeconds must be an integer between 30 and 3600');
    }

    const jobs = await this.repository.claimDuePushJobs({
      workerId,
      asOf,
      limit,
      leaseSeconds,
    });
    const result: ProcessDuePushResult = {
      claimed: jobs.length,
      accepted: 0,
      failed: 0,
    };
    for (const job of jobs) {
      const delivery = await this.sendPush.execute({ job });
      if (delivery.deliveryStatus === 'accepted') result.accepted += 1;
      else result.failed += 1;
    }
    return result;
  }
}
