import { Module } from '@nestjs/common';
import { CreatePermissionUseCase } from './application/create-permission.use-case';
import { FindPermissionByCodeUseCase } from './application/find-permission-by-code.use-case';
import { ListActivePermissionsUseCase } from './application/list-active-permissions.use-case';
import { PERMISSION_REPOSITORY } from './domain/permission.repository';
import { PostgresPermissionRepository } from './infrastructure/postgres-permission.repository';

@Module({
  providers: [
    CreatePermissionUseCase,
    FindPermissionByCodeUseCase,
    ListActivePermissionsUseCase,
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PostgresPermissionRepository,
    },
  ],
  exports: [
    CreatePermissionUseCase,
    FindPermissionByCodeUseCase,
    ListActivePermissionsUseCase,
  ],
})
export class PermissionsModule {}
