import { Inject, Injectable } from '@nestjs/common';
import type { ExpectedDose } from '../domain/expected-dose.entity';
import {
  EXPECTED_DOSE_REPOSITORY,
  type ExpectedDoseRepository,
} from '../domain/expected-dose.repository';
import {
  validateGrace,
  validateWindow,
} from './generate-expected-doses.use-case';
import { validateUuid } from './medication.validation';

export interface ListExpectedDosesQuery {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
  asOf?: Date;
  missedGraceMinutes?: number;
}

@Injectable()
export class ListExpectedDosesUseCase {
  constructor(
    @Inject(EXPECTED_DOSE_REPOSITORY)
    private readonly repository: ExpectedDoseRepository,
  ) {}

  execute(query: ListExpectedDosesQuery): Promise<ExpectedDose[]> {
    validateUuid(query.patientId, 'patientId');
    validateUuid(query.organizationId, 'organizationId');
    validateUuid(query.treatmentId, 'treatmentId');
    validateWindow(query.windowStartsAt, query.windowEndsAt);
    const asOf = query.asOf ?? new Date();
    if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be valid');
    return this.repository.list({
      patientId: query.patientId,
      organizationId: query.organizationId,
      treatmentId: query.treatmentId,
      windowStartsAt: query.windowStartsAt,
      windowEndsAt: query.windowEndsAt,
      asOf,
      missedGraceMinutes: validateGrace(query.missedGraceMinutes ?? 60),
    });
  }
}
