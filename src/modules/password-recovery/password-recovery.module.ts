import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import {
  IsPasswordRecoveryAdministratorUseCase,
  ListPasswordRecoveryRequestsUseCase,
  RequestPasswordRecoveryUseCase,
  ResolvePasswordRecoveryRequestUseCase,
} from './application/password-recovery.use-cases';
import { PASSWORD_RECOVERY_REPOSITORY } from './domain/password-recovery.repository';
import { PasswordRecoveryController } from './http/password-recovery.controller';
import { PostgresPasswordRecoveryRepository } from './infrastructure/postgres-password-recovery.repository';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [PasswordRecoveryController],
  providers: [
    RequestPasswordRecoveryUseCase,
    ListPasswordRecoveryRequestsUseCase,
    ResolvePasswordRecoveryRequestUseCase,
    IsPasswordRecoveryAdministratorUseCase,
    {
      provide: PASSWORD_RECOVERY_REPOSITORY,
      useClass: PostgresPasswordRecoveryRepository,
    },
  ],
})
export class PasswordRecoveryModule {}
