import { Inject, Injectable } from '@nestjs/common';
import type { MedicationInventoryLot } from '../domain/medication-inventory.entity';
import {
  MEDICATION_INVENTORY_REPOSITORY,
  type MedicationInventoryRepository,
} from '../domain/medication-inventory.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class ListInventoryLotsUseCase {
  constructor(
    @Inject(MEDICATION_INVENTORY_REPOSITORY)
    private readonly repository: MedicationInventoryRepository,
  ) {}

  async execute(
    patientId: string,
    organizationId: string,
  ): Promise<MedicationInventoryLot[]> {
    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    if (
      !(await this.repository.patientHasActiveMembership(
        patientId,
        organizationId,
      ))
    ) {
      throw new Error('patient is not active in organization');
    }
    return this.repository.listLots(patientId, organizationId);
  }
}
