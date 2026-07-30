import type {
  ExpectedDose,
  ExpectedDoseGenerationResult,
} from './expected-dose.entity';

export interface GenerateExpectedDosesData {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
  asOf: Date;
  missedGraceMinutes: number;
}

export interface ListExpectedDosesData {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  windowStartsAt: Date;
  windowEndsAt: Date;
  asOf: Date;
  missedGraceMinutes: number;
}

export interface ExpectedDoseRepository {
  generate(
    data: GenerateExpectedDosesData,
  ): Promise<ExpectedDoseGenerationResult>;
  list(data: ListExpectedDosesData): Promise<ExpectedDose[]>;
}

export const EXPECTED_DOSE_REPOSITORY = Symbol('EXPECTED_DOSE_REPOSITORY');
