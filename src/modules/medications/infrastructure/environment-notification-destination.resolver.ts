import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationDestinationResolver } from '../domain/notification-destination-resolver';

@Injectable()
export class EnvironmentNotificationDestinationResolver
  implements NotificationDestinationResolver
{
  constructor(private readonly configService: ConfigService) {}

  async resolvePushToken(destinationReference: string): Promise<string> {
    const raw = this.configService.get<string>(
      'notifications.destinationTokensJson',
    );
    if (!raw) throw new Error('notification destination resolver is not configured');

    let destinations: unknown;
    try {
      destinations = JSON.parse(raw);
    } catch {
      throw new Error('notification destination resolver configuration is invalid');
    }
    if (
      !destinations ||
      typeof destinations !== 'object' ||
      Array.isArray(destinations)
    ) {
      throw new Error('notification destination resolver configuration is invalid');
    }
    const token = (destinations as Record<string, unknown>)[
      destinationReference
    ];
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('push destination reference cannot be resolved');
    }
    return token.trim();
  }
}
