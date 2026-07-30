import { Inject, Injectable } from '@nestjs/common';
import type { NotificationJob } from '../domain/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import {
  normalizeRequiredText,
  validateUuid,
} from './medication.validation';

@Injectable()
export class ClaimNotificationJobsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  execute(command: {
    patientId: string;
    organizationId: string;
    workerId: string;
    asOf?: Date;
    limit?: number;
    leaseSeconds?: number;
  }): Promise<NotificationJob[]> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    const workerId = normalizeRequiredText(command.workerId, 'workerId');
    const asOf = command.asOf ?? new Date();
    if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be valid');
    const limit = command.limit ?? 25;
    const leaseSeconds = command.leaseSeconds ?? 300;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100');
    }
    if (
      !Number.isInteger(leaseSeconds) ||
      leaseSeconds < 30 ||
      leaseSeconds > 3600
    ) {
      throw new Error('leaseSeconds must be an integer between 30 and 3600');
    }
    return this.repository.claimJobs({
      patientId: command.patientId,
      organizationId: command.organizationId,
      workerId,
      asOf,
      limit,
      leaseSeconds,
    });
  }
}
