import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import type {
  PushNotificationMessage,
  PushNotificationProvider,
  PushNotificationResult,
} from '../domain/push-notification-provider';

type MessagingFactory = (app: App) => Pick<Messaging, 'send'>;

@Injectable()
export class FirebasePushNotificationProvider
  implements PushNotificationProvider
{
  private app: App | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly messagingFactory: MessagingFactory = getMessaging,
  ) {}

  async send(
    message: PushNotificationMessage,
  ): Promise<PushNotificationResult> {
    const destinationToken = message.destinationToken.trim();
    if (!destinationToken) throw new Error('push destination token is required');
    if (!message.title.trim() || !message.body.trim()) {
      throw new Error('push title and body are required');
    }

    const providerMessageId = await this.messagingFactory(this.getApp()).send({
      token: destinationToken,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data,
    });

    return { provider: 'firebase-cloud-messaging', providerMessageId };
  }

  private getApp(): App {
    if (this.app) return this.app;
    const existingApp = getApps()[0];
    if (existingApp) {
      this.app = existingApp;
      return existingApp;
    }

    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('firebase admin credentials are not configured');
    }

    this.app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return this.app;
  }
}
