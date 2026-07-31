import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AddCareRelationshipUseCase } from './application/add-care-relationship.use-case';
import { AddConsentUseCase } from './application/add-consent.use-case';
import { AddEmergencyContactUseCase } from './application/add-emergency-contact.use-case';
import { FindPatientByIdUseCase } from './application/find-patient-by-id.use-case';
import { ListCareRelationshipsUseCase } from './application/list-care-relationships.use-case';
import { ListConsentsUseCase } from './application/list-consents.use-case';
import { ListEmergencyContactsUseCase } from './application/list-emergency-contacts.use-case';
import { RegisterPatientUseCase } from './application/register-patient.use-case';
import { UpdatePatientProfileUseCase } from './application/update-patient-profile.use-case';
import { PATIENT_REPOSITORY } from './domain/patient.repository';
import { PatientsController } from './http/patients.controller';
import { PostgresPatientRepository } from './infrastructure/postgres-patient.repository';

@Module({
  imports: [AuditModule, AuthModule, AuthorizationModule],
  controllers: [PatientsController],
  providers: [
    RegisterPatientUseCase,
    FindPatientByIdUseCase,
    UpdatePatientProfileUseCase,
    AddEmergencyContactUseCase,
    AddCareRelationshipUseCase,
    AddConsentUseCase,
    ListCareRelationshipsUseCase,
    ListEmergencyContactsUseCase,
    ListConsentsUseCase,
    {
      provide: PATIENT_REPOSITORY,
      useClass: PostgresPatientRepository,
    },
  ],
  exports: [
    RegisterPatientUseCase,
    FindPatientByIdUseCase,
    UpdatePatientProfileUseCase,
    AddEmergencyContactUseCase,
    AddCareRelationshipUseCase,
    AddConsentUseCase,
    ListCareRelationshipsUseCase,
    ListEmergencyContactsUseCase,
    ListConsentsUseCase,
  ],
})
export class PatientsModule {}
