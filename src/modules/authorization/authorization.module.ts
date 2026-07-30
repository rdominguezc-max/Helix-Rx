import { Module } from '@nestjs/common';
import { AuthorizationService } from './application/authorization.service';
import { EvaluateAuthorizationUseCase } from './application/evaluate-authorization.use-case';
import { AUTHORIZATION_REPOSITORY } from './domain/authorization.repository';
import { PostgresAuthorizationRepository } from './infrastructure/postgres-authorization.repository';

@Module({
  providers: [
    AuthorizationService,
    EvaluateAuthorizationUseCase,
    {
      provide: AUTHORIZATION_REPOSITORY,
      useClass: PostgresAuthorizationRepository,
    },
  ],
  exports: [AuthorizationService, EvaluateAuthorizationUseCase],
})
export class AuthorizationModule {}
