import { Inject, Injectable } from '@nestjs/common';
import type { NotificationJob } from '../domain/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import { validateUuid } from './medication.validation';
import { validateNotificationWindow } from './notification.validation';

@Injectable()
export class PrepareNotificationJobsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  execute(command: {
    patientId: string;
    organizationId: string;
    windowStartsAt: Date;
    windowEndsAt: Date;
  }): Promise<NotificationJob[]> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateNotificationWindow(command.windowStartsAt, command.windowEndsAt);
    return this.repository.prepareJobs(command);
  }
}
