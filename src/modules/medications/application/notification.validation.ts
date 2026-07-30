import type {
  NotificationChannel,
  NotificationPreferenceStatus,
} from '../domain/notification.entity';

const allowedChannels = new Set<NotificationChannel>(['push', 'email', 'sms']);
const allowedPreferenceStatuses = new Set<NotificationPreferenceStatus>([
  'active',
  'paused',
]);

export function normalizeNotificationChannels(
  values: NotificationChannel[],
): NotificationChannel[] {
  const channels = [...new Set(values)];
  if (channels.some((channel) => !allowedChannels.has(channel))) {
    throw new Error('notification channel is not supported');
  }
  return channels.sort();
}

export function validatePreferenceStatus(
  status: NotificationPreferenceStatus,
): void {
  if (!allowedPreferenceStatuses.has(status)) {
    throw new Error('notification preference status is not supported');
  }
}

export function validateReminderLeadMinutes(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 1440) {
    throw new Error(
      'reminderLeadMinutes must be an integer between 0 and 1440',
    );
  }
}

export function validateNotificationWindow(
  windowStartsAt: Date,
  windowEndsAt: Date,
): void {
  if (
    Number.isNaN(windowStartsAt.getTime()) ||
    Number.isNaN(windowEndsAt.getTime())
  ) {
    throw new Error('notification window must be valid');
  }
  if (windowEndsAt.getTime() < windowStartsAt.getTime()) {
    throw new Error('windowEndsAt cannot be before windowStartsAt');
  }
  if (
    windowEndsAt.getTime() - windowStartsAt.getTime() >
    30 * 24 * 60 * 60 * 1000
  ) {
    throw new Error('notification window cannot exceed 30 days');
  }
}
