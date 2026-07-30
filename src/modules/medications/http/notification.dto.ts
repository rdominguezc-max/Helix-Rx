import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationPreferenceStatus,
} from '../domain/notification.entity';

export interface SetNotificationPreferenceDto {
  enabledChannels: NotificationChannel[];
  reminderLeadMinutes?: number;
  status?: NotificationPreferenceStatus;
}

export interface PrepareNotificationJobsDto {
  windowStartsAt: string;
  windowEndsAt: string;
}

export interface ClaimNotificationJobsDto {
  workerId: string;
  asOf?: string;
  limit?: number;
  leaseSeconds?: number;
}

export interface RecordNotificationDeliveryDto {
  claimToken: string;
  provider: string;
  deliveryStatus: NotificationDeliveryStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  detail?: string | null;
  occurredAt?: string | null;
}

export function parseNotificationDate(
  value: string | null | undefined,
  label: string,
  required = false,
): Date | undefined {
  if (!value) {
    if (required) throw new Error(`${label} is required`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be valid`);
  return date;
}
