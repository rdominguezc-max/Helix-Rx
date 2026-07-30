import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { CreateMembershipUseCase } from './application/create-membership.use-case';
import { CreateOrganizationUseCase } from './application/create-organization.use-case';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import { ORGANIZATION_REPOSITORY } from './domain/organization.repository';
import { PostgresMembershipRepository } from './infrastructure/postgres-membership.repository';
import { PostgresOrganizationRepository } from './infrastructure/postgres-organization.repository';

@Module({
  imports: [RolesModule],
  providers: [
    CreateOrganizationUseCase,
    CreateMembershipUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PostgresOrganizationRepository,
    },
    {
      provide: MEMBERSHIP_REPOSITORY,
      useClass: PostgresMembershipRepository,
    },
  ],
  exports: [CreateOrganizationUseCase, CreateMembershipUseCase],
})
export class OrganizationsModule {}
