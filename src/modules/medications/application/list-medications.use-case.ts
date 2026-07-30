import { Inject, Injectable } from '@nestjs/common';
import type { Medication } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class ListMedicationsUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
  ) {}

  execute(organizationId: string): Promise<Medication[]> {
    validateUuid(organizationId, 'organizationId');
    return this.repository.listMedications(organizationId);
  }
}
