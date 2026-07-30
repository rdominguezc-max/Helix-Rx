import { Inject, Injectable } from '@nestjs/common';
import type { PatientCareRelationship } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../domain/patient.repository';
import { validateUuid } from './patient.validation';

export interface ListPatientScopedQuery {
  patientId: string;
  organizationId: string;
}

@Injectable()
export class ListCareRelationshipsUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(
    query: ListPatientScopedQuery,
  ): Promise<PatientCareRelationship[]> {
    validateUuid(query.patientId, 'patientId');
    validateUuid(query.organizationId, 'organizationId');
    await this.assertPatientOrganizationMembership(
      query.patientId,
      query.organizationId,
    );

    return this.patientRepository.listCareRelationships(query);
  }

  private async assertPatientOrganizationMembership(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const membership =
      await this.patientRepository.findActiveOrganizationMembership(
        patientId,
        organizationId,
      );

    if (!membership) {
      throw new Error('patient is not active in organization');
    }
  }
}
