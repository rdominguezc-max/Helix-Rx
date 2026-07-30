export interface NotificationDestinationResolver {
  resolvePushToken(destinationReference: string): Promise<string>;
}

export const NOTIFICATION_DESTINATION_RESOLVER = Symbol(
  'NOTIFICATION_DESTINATION_RESOLVER',
);
