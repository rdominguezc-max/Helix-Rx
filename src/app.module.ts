import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AccountModule } from './modules/account/account.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { CoreModule } from './modules/core/core.module';
import { HealthModule } from './modules/health/health.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    DatabaseModule,
    AccountModule,
    AuditModule,
    AuthModule,
    AuthorizationModule,
    CoreModule,
    HealthModule,
    MedicationsModule,
    OrganizationsModule,
    PatientsModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
  ],
})
export class AppModule {}

