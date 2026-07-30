import { Inject, Injectable } from '@nestjs/common';
import type { MedicationDoseEvent } from '../domain/treatment-lifecycle.entity';
import {
  TREATMENT_LIFECYCLE_REPOSITORY,
  type TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class ListDoseEventsUseCase {
  constructor(
    @Inject(TREATMENT_LIFECYCLE_REPOSITORY)
    private readonly repository: TreatmentLifecycleRepository,
  ) {}

  execute(
    patientId: string,
    organizationId: string,
    treatmentId: string,
  ): Promise<MedicationDoseEvent[]> {
    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    validateUuid(treatmentId, 'treatmentId');
    return this.repository.listDoseEvents(
      patientId,
      organizationId,
      treatmentId,
    );
  }
}
