export interface PushNotificationMessage {
  destinationToken: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

export interface PushNotificationResult {
  provider: string;
  providerMessageId: string;
}

export interface PushNotificationProvider {
  send(message: PushNotificationMessage): Promise<PushNotificationResult>;
}

export const PUSH_NOTIFICATION_PROVIDER = Symbol('PUSH_NOTIFICATION_PROVIDER');
