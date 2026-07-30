export type NotificationChannel = 'push' | 'email' | 'sms';
export type NotificationPreferenceStatus = 'active' | 'paused';
export type NotificationJobStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled';
export type NotificationDeliveryStatus = 'accepted' | 'delivered' | 'failed';
export type NotificationDestinationStatus = 'pending' | 'verified' | 'revoked';

export interface PatientNotificationDestination {
  id: string;
  patientId: string;
  organizationId: string;
  channel: NotificationChannel;
  destinationReference: string;
  maskedLabel: string;
  status: NotificationDestinationStatus;
  verifiedAt: Date | null;
  revokedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientNotificationPreference {
  id: string;
  patientId: string;
  organizationId: string;
  enabledChannels: NotificationChannel[];
  reminderLeadMinutes: number;
  status: NotificationPreferenceStatus;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationJob {
  id: string;
  patientId: string;
  organizationId: string;
  expectedDoseId: string;
  jobType: 'dose_reminder';
  channel: NotificationChannel;
  destinationId: string;
  destinationReference: string | null;
  destinationMaskedLabel: string | null;
  scheduledFor: Date;
  status: NotificationJobStatus;
  claimToken: string | null;
  claimedBy: string | null;
  claimedAt: Date | null;
  leaseExpiresAt: Date | null;
  attemptCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryEvent {
  id: string;
  notificationJobId: string;
  provider: string;
  deliveryStatus: NotificationDeliveryStatus;
  providerMessageId: string | null;
  errorCode: string | null;
  detail: string | null;
  occurredAt: Date;
  recordedAt: Date;
}
