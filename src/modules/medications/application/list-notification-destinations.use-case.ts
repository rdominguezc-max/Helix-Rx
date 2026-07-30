import { Inject, Injectable } from '@nestjs/common';
import type { PatientNotificationDestination } from '../domain/notification.entity';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../domain/notification.repository';

@Injectable()
export class ListNotificationDestinationsUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repository: NotificationRepository) {}
  execute(patientId: string, organizationId: string): Promise<PatientNotificationDestination[]> {
    return this.repository.listDestinations(patientId, organizationId);
  }
}
