import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/create-user.use-case';
import { FindUserByEmailUseCase } from './application/find-user-by-email.use-case';
import { FindUserByIdUseCase } from './application/find-user-by-id.use-case';
import { UpdateBasicProfileUseCase } from './application/update-basic-profile.use-case';
import { USER_REPOSITORY } from './domain/user.repository';
import { PostgresUserRepository } from './infrastructure/postgres-user.repository';

@Module({
  providers: [
    CreateUserUseCase,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
    UpdateBasicProfileUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PostgresUserRepository,
    },
  ],
  exports: [
    USER_REPOSITORY,
    CreateUserUseCase,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
    UpdateBasicProfileUseCase,
  ],
})
export class UsersModule {}
