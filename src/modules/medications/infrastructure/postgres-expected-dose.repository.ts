import { Injectable } from '@nestjs/common';
import {
  type DatabaseQueryExecutor,
  DatabaseService,
} from '../../../database/database.service';
import type {
  ExpectedDose,
  ExpectedDoseGenerationResult,
} from '../domain/expected-dose.entity';
import type {
  ExpectedDoseRepository,
  GenerateExpectedDosesData,
  ListExpectedDosesData,
} from '../domain/expected-dose.repository';
import type { TreatmentStatus } from '../domain/medication.entity';

interface ScheduleTreatmentRow {
  id: string;
  status: TreatmentStatus;
  frequency_interval_hours: string | null;
  administration_times: unknown;
  starts_on: Date | string;
  ends_on: Date | string | null;
  is_as_needed: boolean;
  timezone: string;
}

interface ExpectedDoseRow {
  id: string;
  patient_treatment_id: string;
  patient_id: string;
  organization_id: string;
  scheduled_for: Date;
  timezone: string;
  effective_status: ExpectedDose['status'];
  medication_dose_event_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapExpectedDose(row: ExpectedDoseRow): ExpectedDose {
  return {
    id: row.id,
    patientTreatmentId: row.patient_treatment_id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    scheduledFor: row.scheduled_for,
    timezone: row.timezone,
    status: row.effective_status,
    medicationDoseEventId: row.medication_dose_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PostgresExpectedDoseRepository
  implements ExpectedDoseRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

  async generate(
    data: GenerateExpectedDosesData,
  ): Promise<ExpectedDoseGenerationResult> {
    return this.databaseService.transaction(async (executor) => {
      const treatment = await this.loadTreatment(data, executor);
      if (treatment.status !== 'active') {
        throw new Error('expected doses require an active treatment');
      }
      if (treatment.is_as_needed) {
        throw new Error('PRN treatments do not generate expected doses');
      }

      const administrationTimes = Array.isArray(
        treatment.administration_times,
      )
        ? treatment.administration_times.filter(
            (value): value is string => typeof value === 'string',
          )
        : [];
      const generatedCount =
        administrationTimes.length > 0
          ? await this.generateFromTimes(
              data,
              treatment,
              administrationTimes,
              executor,
            )
          : await this.generateFromInterval(data, treatment, executor);

      await executor.query(
        `UPDATE medication_expected_doses expected
         SET status = CASE
               WHEN event.event_status = 'cancelled' THEN 'cancelled'
               ELSE 'fulfilled'
             END,
             medication_dose_event_id = event.id,
             updated_at = now()
         FROM medication_dose_events event
         WHERE expected.patient_treatment_id = $1
           AND expected.scheduled_for = event.scheduled_for
           AND event.patient_treatment_id = expected.patient_treatment_id
           AND expected.medication_dose_event_id IS NULL`,
        [data.treatmentId],
      );

      return {
        treatmentId: data.treatmentId,
        timezone: treatment.timezone,
        windowStartsAt: data.windowStartsAt,
        windowEndsAt: data.windowEndsAt,
        generatedCount,
        expectedDoses: await this.listWithExecutor(data, executor),
      };
    });
  }

  async list(data: ListExpectedDosesData): Promise<ExpectedDose[]> {
    return this.listWithExecutor(data, this.databaseService);
  }

  private async loadTreatment(
    data: GenerateExpectedDosesData,
    executor: DatabaseQueryExecutor,
  ): Promise<ScheduleTreatmentRow> {
    const result = await executor.query<ScheduleTreatmentRow>(
      `SELECT treatment.id, treatment.status,
              treatment.frequency_interval_hours,
              treatment.administration_times, treatment.starts_on,
              treatment.ends_on, treatment.is_as_needed,
              COALESCE(profile.timezone, 'America/Hermosillo') AS timezone
       FROM patient_treatments treatment
       LEFT JOIN patient_profiles profile
         ON profile.patient_id = treatment.patient_id
        AND profile.deleted_at IS NULL
       WHERE treatment.id = $1 AND treatment.patient_id = $2
         AND treatment.organization_id = $3
         AND treatment.deleted_at IS NULL
       LIMIT 1`,
      [data.treatmentId, data.patientId, data.organizationId],
    );
    const treatment = result.rows[0];
    if (!treatment) throw new Error('treatment not found');
    return treatment;
  }

  private async generateFromTimes(
    data: GenerateExpectedDosesData,
    treatment: ScheduleTreatmentRow,
    administrationTimes: string[],
    executor: DatabaseQueryExecutor,
  ): Promise<number> {
    const result = await executor.query<{ id: string }>(
      `WITH local_days AS (
         SELECT generate_series(
           ($4 AT TIME ZONE $6)::date,
           ($5 AT TIME ZONE $6)::date,
           interval '1 day'
         )::date AS local_day
       ),
       occurrences AS (
         SELECT (local_day + dose_time::time) AT TIME ZONE $6 AS scheduled_for
         FROM local_days
         CROSS JOIN unnest($7::text[]) AS dose_time
         WHERE local_day >= $8::date
           AND ($9::date IS NULL OR local_day <= $9::date)
       )
       INSERT INTO medication_expected_doses (
         patient_treatment_id, patient_id, organization_id,
         scheduled_for, timezone
       )
       SELECT $1, $2, $3, scheduled_for, $6
       FROM occurrences
       WHERE scheduled_for >= $4 AND scheduled_for <= $5
       ON CONFLICT (patient_treatment_id, scheduled_for) DO NOTHING
       RETURNING id`,
      [
        data.treatmentId,
        data.patientId,
        data.organizationId,
        data.windowStartsAt,
        data.windowEndsAt,
        treatment.timezone,
        administrationTimes,
        treatment.starts_on,
        treatment.ends_on,
      ],
    );
    return result.rowCount ?? 0;
  }

  private async generateFromInterval(
    data: GenerateExpectedDosesData,
    treatment: ScheduleTreatmentRow,
    executor: DatabaseQueryExecutor,
  ): Promise<number> {
    if (!treatment.frequency_interval_hours) {
      throw new Error('treatment does not have a schedulable frequency');
    }
    const result = await executor.query<{ id: string }>(
      `WITH occurrences AS (
         SELECT generate_series(
           ($7::date::timestamp AT TIME ZONE $6),
           $5,
           $8::numeric * interval '1 hour'
         ) AS scheduled_for
       )
       INSERT INTO medication_expected_doses (
         patient_treatment_id, patient_id, organization_id,
         scheduled_for, timezone
       )
       SELECT $1, $2, $3, scheduled_for, $6
       FROM occurrences
       WHERE scheduled_for >= $4 AND scheduled_for <= $5
         AND (
           $9::date IS NULL
           OR (scheduled_for AT TIME ZONE $6)::date <= $9::date
         )
       ON CONFLICT (patient_treatment_id, scheduled_for) DO NOTHING
       RETURNING id`,
      [
        data.treatmentId,
        data.patientId,
        data.organizationId,
        data.windowStartsAt,
        data.windowEndsAt,
        treatment.timezone,
        treatment.starts_on,
        treatment.frequency_interval_hours,
        treatment.ends_on,
      ],
    );
    return result.rowCount ?? 0;
  }

  private async listWithExecutor(
    data: ListExpectedDosesData,
    executor: DatabaseQueryExecutor,
  ): Promise<ExpectedDose[]> {
    const result = await executor.query<ExpectedDoseRow>(
      `SELECT id, patient_treatment_id, patient_id, organization_id,
              scheduled_for, timezone,
              CASE
                WHEN status = 'scheduled'
                 AND scheduled_for + ($7::int * interval '1 minute') < $6
                  THEN 'missed'
                ELSE status
              END AS effective_status,
              medication_dose_event_id, created_at, updated_at
       FROM medication_expected_doses
       WHERE patient_treatment_id = $1 AND patient_id = $2
         AND organization_id = $3
         AND scheduled_for >= $4 AND scheduled_for <= $5
       ORDER BY scheduled_for, id`,
      [
        data.treatmentId,
        data.patientId,
        data.organizationId,
        data.windowStartsAt,
        data.windowEndsAt,
        data.asOf,
        data.missedGraceMinutes,
      ],
    );
    return result.rows.map(mapExpectedDose);
  }
}
