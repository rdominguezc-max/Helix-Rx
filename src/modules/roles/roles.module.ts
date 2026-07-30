import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { AssignPermissionToRoleUseCase } from './application/assign-permission-to-role.use-case';
import { CreateRoleUseCase } from './application/create-role.use-case';
import { FindRoleByCodeUseCase } from './application/find-role-by-code.use-case';
import { FindRoleByIdUseCase } from './application/find-role-by-id.use-case';
import { ListPermissionsByRoleUseCase } from './application/list-permissions-by-role.use-case';
import { ROLE_REPOSITORY } from './domain/role.repository';
import { PostgresRoleRepository } from './infrastructure/postgres-role.repository';

@Module({
  imports: [PermissionsModule],
  providers: [
    CreateRoleUseCase,
    FindRoleByIdUseCase,
    FindRoleByCodeUseCase,
    AssignPermissionToRoleUseCase,
    ListPermissionsByRoleUseCase,
    {
      provide: ROLE_REPOSITORY,
      useClass: PostgresRoleRepository,
    },
  ],
  exports: [
    CreateRoleUseCase,
    FindRoleByIdUseCase,
    FindRoleByCodeUseCase,
    AssignPermissionToRoleUseCase,
    ListPermissionsByRoleUseCase,
  ],
})
export class RolesModule {}
