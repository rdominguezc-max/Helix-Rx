import { Inject, Injectable } from '@nestjs/common';
import type { PatientNotificationPreference } from '../domain/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class GetNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  execute(
    patientId: string,
    organizationId: string,
  ): Promise<PatientNotificationPreference | null> {
    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    return this.repository.getPreference(patientId, organizationId);
  }
}
