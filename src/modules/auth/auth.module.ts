import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CoreModule } from '../core/core.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { AuthenticateFirebaseUserUseCase } from './application/authenticate-firebase-user.use-case';
import { FIREBASE_TOKEN_VERIFIER } from './domain/firebase-token-verifier';
import { FirebaseBearerAuthGuard } from './http/firebase-bearer-auth.guard';
import { PermissionsGuard } from './http/permissions.guard';
import { FirebaseAdminTokenVerifier } from './infrastructure/firebase-admin-token.verifier';

@Module({
  imports: [AuditModule, AuthorizationModule, CoreModule, UsersModule],
  providers: [
    AuthService,
    AuthenticateFirebaseUserUseCase,
    FirebaseBearerAuthGuard,
    PermissionsGuard,
    {
      provide: FIREBASE_TOKEN_VERIFIER,
      useClass: FirebaseAdminTokenVerifier,
    },
  ],
  exports: [
    AuthService,
    AuthenticateFirebaseUserUseCase,
    FirebaseBearerAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
