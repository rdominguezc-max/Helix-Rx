import type {
  NotificationChannel,
  NotificationDeliveryEvent,
  NotificationDeliveryStatus,
  NotificationJob,
  NotificationPreferenceStatus,
  PatientNotificationPreference,
  PatientNotificationDestination,
} from './notification.entity';

export interface RegisterNotificationDestinationData {
  patientId: string;
  organizationId: string;
  channel: NotificationChannel;
  destinationReference: string;
  maskedLabel: string;
  createdBy?: string | null;
}

export interface SetNotificationPreferenceData {
  patientId: string;
  organizationId: string;
  enabledChannels: NotificationChannel[];
  reminderLeadMinutes: number;
  status: NotificationPreferenceStatus;
  updatedBy?: string | null;
}

export interface PrepareNotificationJobsData {
  patientId: string;
  organizationId: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
}

export interface ClaimNotificationJobsData {
  patientId: string;
  organizationId: string;
  workerId: string;
  asOf: Date;
  limit: number;
  leaseSeconds: number;
}

export interface RecordNotificationDeliveryData {
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
}

export interface NotificationRepository {
  registerDestination(data: RegisterNotificationDestinationData): Promise<PatientNotificationDestination>;
  listDestinations(patientId: string, organizationId: string): Promise<PatientNotificationDestination[]>;
  changeDestinationStatus(
    patientId: string,
    organizationId: string,
    destinationId: string,
    status: 'verified' | 'revoked',
  ): Promise<PatientNotificationDestination>;
  setPreference(
    data: SetNotificationPreferenceData,
  ): Promise<PatientNotificationPreference>;
  getPreference(
    patientId: string,
    organizationId: string,
  ): Promise<PatientNotificationPreference | null>;
  prepareJobs(data: PrepareNotificationJobsData): Promise<NotificationJob[]>;
  claimJobs(data: ClaimNotificationJobsData): Promise<NotificationJob[]>;
  recordDelivery(
    data: RecordNotificationDeliveryData,
  ): Promise<NotificationDeliveryEvent>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
