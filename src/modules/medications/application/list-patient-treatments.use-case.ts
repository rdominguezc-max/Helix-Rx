import { Inject, Injectable } from '@nestjs/common';
import type { PatientTreatment } from '../domain/medication.entity';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/medication.repository';
import { validateUuid } from './medication.validation';

@Injectable()
export class ListPatientTreatmentsUseCase {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly repository: MedicationRepository,
  ) {}

  async execute(
    patientId: string,
    organizationId: string,
  ): Promise<PatientTreatment[]> {
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
    return this.repository.listPatientTreatments(patientId, organizationId);
  }
}
