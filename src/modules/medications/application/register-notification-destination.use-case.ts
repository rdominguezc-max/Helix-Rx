import { Inject, Injectable } from '@nestjs/common';
import type { NotificationChannel, PatientNotificationDestination } from '../domain/notification.entity';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../domain/notification.repository';
import { normalizeNotificationChannels } from './notification.validation';

@Injectable()
export class RegisterNotificationDestinationUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repository: NotificationRepository) {}

  execute(command: {
    patientId: string; organizationId: string; channel: NotificationChannel;
    destinationReference: string; maskedLabel: string; createdBy?: string | null;
  }): Promise<PatientNotificationDestination> {
    const channel = normalizeNotificationChannels([command.channel])[0];
    const destinationReference = command.destinationReference?.trim();
    const maskedLabel = command.maskedLabel?.trim();
    if (!destinationReference || destinationReference.length > 200) throw new Error('destinationReference is required and must not exceed 200 characters');
    if (!maskedLabel || maskedLabel.length > 100) throw new Error('maskedLabel is required and must not exceed 100 characters');
    return this.repository.registerDestination({ ...command, channel, destinationReference, maskedLabel });
  }
}
