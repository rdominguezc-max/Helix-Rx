import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { FirebaseAuthenticatedUser } from '../domain/firebase-authenticated-user';
import type { FirebaseTokenVerifier } from '../domain/firebase-token-verifier';

@Injectable()
export class FirebaseAdminTokenVerifier implements FirebaseTokenVerifier {
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<FirebaseAuthenticatedUser> {
    const decodedToken = await getAuth(this.getApp()).verifyIdToken(idToken);

    if (!decodedToken.email) {
      throw new Error('firebase token email is required');
    }

    return {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email.toLowerCase(),
      emailVerified: decodedToken.email_verified ?? false,
      displayName: decodedToken.name ?? null,
    };
  }

  private getApp(): App {
    if (this.app) {
      return this.app;
    }

    const existingApp = getApps()[0];

    if (existingApp) {
      this.app = existingApp;
      return this.app;
    }

    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('firebase admin credentials are not configured');
    }

    this.app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return this.app;
  }
}
