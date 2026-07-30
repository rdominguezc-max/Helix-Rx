import { Inject, Injectable } from '@nestjs/common';
import type { Patient } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../domain/patient.repository';
import { validateUuid } from './patient.validation';

@Injectable()
export class FindPatientByIdUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(patientId: string): Promise<Patient | null> {
    validateUuid(patientId, 'patientId');

    return this.patientRepository.findById(patientId);
  }
}
