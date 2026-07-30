import { Inject, Injectable } from '@nestjs/common';
import type { MedicationPresentation } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class ListPresentationsUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
  ) {}

  execute(
    medicationId: string,
    organizationId: string,
  ): Promise<MedicationPresentation[]> {
    validateUuid(medicationId, 'medicationId');
    validateUuid(organizationId, 'organizationId');
    return this.repository.listPresentations(medicationId, organizationId);
  }
}
