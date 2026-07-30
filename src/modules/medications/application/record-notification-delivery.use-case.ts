import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationDeliveryEvent,
  NotificationDeliveryStatus,
} from '../domain/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import {
  normalizeOptionalText,
  normalizeRequiredText,
  validateUuid,
} from './medication.validation';

@Injectable()
export class RecordNotificationDeliveryUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  execute(command: {
    patientId: string;
    organizationId: string;
    notificationJobId: string;
    claimToken: string;
    provider: string;
    deliveryStatus: NotificationDeliveryStatus;
    providerMessageId?: string | null;
    errorCode?: string | null;
    detail?: string | null;
    occurredAt?: Date | null;
  }): Promise<NotificationDeliveryEvent> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    validateUuid(command.notificationJobId, 'notificationJobId');
    validateUuid(command.claimToken, 'claimToken');
    const provider = normalizeRequiredText(command.provider, 'provider');
    if (!['accepted', 'delivered', 'failed'].includes(command.deliveryStatus)) {
      throw new Error('deliveryStatus is not supported');
    }
    const detail = normalizeOptionalText(command.detail, 'detail');
    const errorCode = normalizeOptionalText(command.errorCode, 'errorCode');
    if (command.deliveryStatus === 'failed' && !detail && !errorCode) {
      throw new Error('failed delivery requires errorCode or detail');
    }
    return this.repository.recordDelivery({
      ...command,
      provider,
      providerMessageId: normalizeOptionalText(
        command.providerMessageId,
        'providerMessageId',
      ),
      errorCode,
      detail,
    });
  }
}
