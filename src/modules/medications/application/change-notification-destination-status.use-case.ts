import { Inject, Injectable } from '@nestjs/common';
import type { PatientNotificationDestination } from '../domain/notification.entity';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../domain/notification.repository';

@Injectable()
export class ChangeNotificationDestinationStatusUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repository: NotificationRepository) {}
  execute(command: {
    patientId: string; organizationId: string; destinationId: string;
    status: 'verified' | 'revoked';
  }): Promise<PatientNotificationDestination> {
    return this.repository.changeDestinationStatus(
      command.patientId, command.organizationId, command.destinationId, command.status,
    );
  }
}
