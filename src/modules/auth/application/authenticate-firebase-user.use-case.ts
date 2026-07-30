import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import { IsFeatureEnabledUseCase } from '../../core/application/is-feature-enabled.use-case';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../users/domain/user.repository';
import type { AuthenticatedUserContext } from '../domain/authenticated-user-context';
import {
  FIREBASE_TOKEN_VERIFIER,
  type FirebaseTokenVerifier,
} from '../domain/firebase-token-verifier';
import { splitDisplayName, validateIdToken } from './auth.validation';

export interface AuthenticateFirebaseUserCommand {
  idToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthenticateFirebaseUserUseCase {
  constructor(
    @Inject(FIREBASE_TOKEN_VERIFIER)
    private readonly firebaseTokenVerifier: FirebaseTokenVerifier,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly isFeatureEnabledUseCase: IsFeatureEnabledUseCase,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: AuthenticateFirebaseUserCommand,
  ): Promise<AuthenticatedUserContext> {
    validateIdToken(command.idToken);

    const firebaseAuthEnabled = await this.isFeatureEnabledUseCase.execute({
      key: 'auth.firebase.enabled',
    });

    if (!firebaseAuthEnabled) {
      await this.auditFailure(command, 'firebase_auth_disabled');
      throw new Error('firebase authentication is disabled');
    }

    try {
      const firebaseUser = await this.firebaseTokenVerifier.verifyIdToken(
        command.idToken,
      );
      const linkedUser = await this.findOrLinkInternalUser(firebaseUser);
      const activeUser = await this.userRepository.touchLoginActivity(
        linkedUser.id,
      );

      if (!activeUser) {
        await this.auditFailure(command, 'internal_user_not_found');
        throw new Error('internal user not found');
      }

      await this.auditService.recordEvent({
        actorUserId: activeUser.id,
        action: 'auth.firebase.login',
        resourceType: 'auth',
        resourceId: activeUser.id,
        result: 'success',
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        metadata: {
          firebaseUid: firebaseUser.firebaseUid,
          emailVerified: firebaseUser.emailVerified,
        },
      });

      return {
        userId: activeUser.id,
        firebaseUid: firebaseUser.firebaseUid,
        email: activeUser.email,
        emailVerified: activeUser.emailVerified,
      };
    } catch (error) {
      await this.auditFailure(command, 'firebase_authentication_failed');
      throw error;
    }
  }

  private async findOrLinkInternalUser(firebaseUser: {
    firebaseUid: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
  }) {
    const userByFirebaseUid = await this.userRepository.findByFirebaseUid(
      firebaseUser.firebaseUid,
    );

    if (userByFirebaseUid) {
      return userByFirebaseUid;
    }

    const userByEmail = await this.userRepository.findByEmail(firebaseUser.email);

    if (userByEmail) {
      const linkedUser = await this.userRepository.linkFirebaseUser({
        userId: userByEmail.id,
        firebaseUid: firebaseUser.firebaseUid,
        emailVerified: firebaseUser.emailVerified,
      });

      if (!linkedUser) {
        throw new Error('internal user not found');
      }

      return linkedUser;
    }

    const name = splitDisplayName(firebaseUser.displayName);

    return this.userRepository.create({
      firstName: name.firstName,
      lastName: name.lastName,
      email: firebaseUser.email,
      firebaseUid: firebaseUser.firebaseUid,
      emailVerified: firebaseUser.emailVerified,
      language: 'es',
      preferredLocale: 'es-MX',
      timezone: 'America/Hermosillo',
      status: 'active',
    });
  }

  private async auditFailure(
    command: AuthenticateFirebaseUserCommand,
    reason: string,
  ): Promise<void> {
    await this.auditService.recordEvent({
      action: 'auth.firebase.login',
      resourceType: 'auth',
      result: 'failure',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        reason,
      },
    });
  }
}
