import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AddInventoryLotUseCase } from './application/add-inventory-lot.use-case';
import { ChangeTreatmentStatusUseCase } from './application/change-treatment-status.use-case';
import { DoseConversionService } from './application/dose-conversion.service';
import { ListInventoryLotsUseCase } from './application/list-inventory-lots.use-case';
import { ListDoseEventsUseCase } from './application/list-dose-events.use-case';
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
import { TREATMENT_LIFECYCLE_REPOSITORY } from './domain/treatment-lifecycle.repository';
import { MedicationInventoryController } from './http/medication-inventory.controller';
import { MedicationsController } from './http/medications.controller';
import { TreatmentLifecycleController } from './http/treatment-lifecycle.controller';
import { PostgresMedicationInventoryRepository } from './infrastructure/postgres-medication-inventory.repository';
import { PostgresMedicationRepository } from './infrastructure/postgres-medication.repository';
import { PostgresTreatmentLifecycleRepository } from './infrastructure/postgres-treatment-lifecycle.repository';

@Module({
  imports: [AuditModule],
  controllers: [
    MedicationsController,
    MedicationInventoryController,
    TreatmentLifecycleController,
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
  ],
})
export class MedicationsModule {}
