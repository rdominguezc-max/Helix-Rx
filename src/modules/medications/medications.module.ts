import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AddInventoryLotUseCase } from './application/add-inventory-lot.use-case';
import { ChangeTreatmentStatusUseCase } from './application/change-treatment-status.use-case';
import { ClaimNotificationJobsUseCase } from './application/claim-notification-jobs.use-case';
import { DoseConversionService } from './application/dose-conversion.service';
import { GenerateExpectedDosesUseCase } from './application/generate-expected-doses.use-case';
import { GetNotificationPreferenceUseCase } from './application/get-notification-preference.use-case';
import { GetTreatmentInsightUseCase } from './application/get-treatment-insight.use-case';
import { ListInventoryLotsUseCase } from './application/list-inventory-lots.use-case';
import { ListDoseEventsUseCase } from './application/list-dose-events.use-case';
import { ListExpectedDosesUseCase } from './application/list-expected-doses.use-case';
import { PrepareNotificationJobsUseCase } from './application/prepare-notification-jobs.use-case';
import { RecordNotificationDeliveryUseCase } from './application/record-notification-delivery.use-case';
import { SetNotificationPreferenceUseCase } from './application/set-notification-preference.use-case';
import { RegisterNotificationDestinationUseCase } from './application/register-notification-destination.use-case';
import { ListNotificationDestinationsUseCase } from './application/list-notification-destinations.use-case';
import { ChangeNotificationDestinationStatusUseCase } from './application/change-notification-destination-status.use-case';
import { SendPushNotificationUseCase } from './application/send-push-notification.use-case';
import { RecordInventoryMovementUseCase } from './application/record-inventory-movement.use-case';
import { RecordDoseEventUseCase } from './application/record-dose-event.use-case';
import { CreateMedicationUseCase } from './application/create-medication.use-case';
import { CreatePresentationUseCase } from './application/create-presentation.use-case';
import { CreateTreatmentUseCase } from './application/create-treatment.use-case';
import { ListMedicationsUseCase } from './application/list-medications.use-case';
import { ListPatientTreatmentsUseCase } from './application/list-patient-treatments.use-case';
import { ListPresentationsUseCase } from './application/list-presentations.use-case';
import { MEDICATION_INVENTORY_REPOSITORY } from './domain/medication-inventory.repository';
import { MEDICATION_REPOSITORY } from './domain/medication.repository';
import { NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { EXPECTED_DOSE_REPOSITORY } from './domain/expected-dose.repository';
import { TREATMENT_LIFECYCLE_REPOSITORY } from './domain/treatment-lifecycle.repository';
import { PUSH_NOTIFICATION_PROVIDER } from './domain/push-notification-provider';
import { MedicationInventoryController } from './http/medication-inventory.controller';
import { MedicationsController } from './http/medications.controller';
import { NotificationController } from './http/notification.controller';
import { ExpectedDoseController } from './http/expected-dose.controller';
import { TreatmentLifecycleController } from './http/treatment-lifecycle.controller';
import { PostgresMedicationInventoryRepository } from './infrastructure/postgres-medication-inventory.repository';
import { PostgresMedicationRepository } from './infrastructure/postgres-medication.repository';
import { PostgresNotificationRepository } from './infrastructure/postgres-notification.repository';
import { PostgresExpectedDoseRepository } from './infrastructure/postgres-expected-dose.repository';
import { PostgresTreatmentLifecycleRepository } from './infrastructure/postgres-treatment-lifecycle.repository';
import { FirebasePushNotificationProvider } from './infrastructure/firebase-push-notification.provider';

@Module({
  imports: [AuditModule],
  controllers: [
    MedicationsController,
    MedicationInventoryController,
    TreatmentLifecycleController,
    ExpectedDoseController,
    NotificationController,
  ],
  providers: [
    CreateMedicationUseCase,
    ListMedicationsUseCase,
    CreatePresentationUseCase,
    ListPresentationsUseCase,
    CreateTreatmentUseCase,
    ListPatientTreatmentsUseCase,
    AddInventoryLotUseCase,
    ListInventoryLotsUseCase,
    RecordInventoryMovementUseCase,
    DoseConversionService,
    GetTreatmentInsightUseCase,
    GenerateExpectedDosesUseCase,
    ListExpectedDosesUseCase,
    SetNotificationPreferenceUseCase,
    GetNotificationPreferenceUseCase,
    PrepareNotificationJobsUseCase,
    ClaimNotificationJobsUseCase,
    RecordNotificationDeliveryUseCase,
    RegisterNotificationDestinationUseCase,
    ListNotificationDestinationsUseCase,
    ChangeNotificationDestinationStatusUseCase,
    SendPushNotificationUseCase,
    ChangeTreatmentStatusUseCase,
    RecordDoseEventUseCase,
    ListDoseEventsUseCase,
    {
      provide: MEDICATION_REPOSITORY,
      useClass: PostgresMedicationRepository,
    },
    {
      provide: MEDICATION_INVENTORY_REPOSITORY,
      useClass: PostgresMedicationInventoryRepository,
    },
    {
      provide: TREATMENT_LIFECYCLE_REPOSITORY,
      useClass: PostgresTreatmentLifecycleRepository,
    },
    {
      provide: EXPECTED_DOSE_REPOSITORY,
      useClass: PostgresExpectedDoseRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PostgresNotificationRepository,
    },
    {
      provide: PUSH_NOTIFICATION_PROVIDER,
      useClass: FirebasePushNotificationProvider,
    },
  ],
})
export class MedicationsModule {}
