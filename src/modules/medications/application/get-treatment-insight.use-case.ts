import { Inject, Injectable } from '@nestjs/common';
import type {
  InventoryRiskLevel,
  TreatmentAlert,
  TreatmentInsight,
} from '../domain/treatment-insight.entity';
import {
  TREATMENT_LIFECYCLE_REPOSITORY,
  type TreatmentInsightSource,
  type TreatmentLifecycleRepository,
} from '../domain/treatment-lifecycle.repository';
import { validatePositive, validateUuid } from './medication.validation';

export interface GetTreatmentInsightQuery {
  patientId: string;
  organizationId: string;
  treatmentId: string;
  windowDays?: number;
  lowInventoryDays?: number;
  expirationWarningDays?: number;
  missedGraceMinutes?: number;
  asOf?: Date;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

@Injectable()
export class GetTreatmentInsightUseCase {
  constructor(
    @Inject(TREATMENT_LIFECYCLE_REPOSITORY)
    private readonly repository: TreatmentLifecycleRepository,
  ) {}

  async execute(query: GetTreatmentInsightQuery): Promise<TreatmentInsight> {
    validateUuid(query.patientId, 'patientId');
    validateUuid(query.organizationId, 'organizationId');
    validateUuid(query.treatmentId, 'treatmentId');
    const windowDays = this.integerWithin(
      query.windowDays ?? 30,
      'windowDays',
      1,
      365,
    );
    const lowInventoryDays = this.integerWithin(
      query.lowInventoryDays ?? 7,
      'lowInventoryDays',
      1,
      90,
    );
    const expirationWarningDays = this.integerWithin(
      query.expirationWarningDays ?? 30,
      'expirationWarningDays',
      1,
      365,
    );
    const missedGraceMinutes = this.integerWithin(
      query.missedGraceMinutes ?? 60,
      'missedGraceMinutes',
      0,
      1440,
    );
    const asOf = query.asOf ?? new Date();
    if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be valid');
    const windowStartsAt = new Date(
      asOf.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );
    const source = await this.repository.getTreatmentInsightSource(
      query.patientId,
      query.organizationId,
      query.treatmentId,
      windowStartsAt,
      asOf,
      missedGraceMinutes,
    );

    return {
      patientId: source.patientId,
      organizationId: source.organizationId,
      treatmentId: source.treatmentId,
      asOf,
      adherence: this.adherence(source, windowStartsAt, asOf),
      inventory: this.inventory(source, asOf, lowInventoryDays),
      alerts: this.alerts(
        source,
        asOf,
        lowInventoryDays,
        expirationWarningDays,
      ),
    };
  }

  private adherence(
    source: TreatmentInsightSource,
    windowStartsAt: Date,
    windowEndsAt: Date,
  ): TreatmentInsight['adherence'] {
    const count = (
      eventStatus: 'confirmed' | 'omitted' | 'cancelled',
      timingStatus?: 'on_time',
    ): number =>
      source.doseSummaries
        .filter(
          (summary) =>
            summary.eventStatus === eventStatus &&
            (timingStatus === undefined ||
              summary.timingStatus === timingStatus),
        )
        .reduce((total, summary) => total + summary.count, 0);
    const confirmedDoses = count('confirmed');
    const omittedDoses = count('omitted');
    const cancelledDoses = count('cancelled');
    const onTimeDoses = count('confirmed', 'on_time');
    const adherenceDenominator =
      confirmedDoses + omittedDoses + source.unrecordedDoses;

    return {
      windowStartsAt,
      windowEndsAt,
      recordedEvents: confirmedDoses + omittedDoses + cancelledDoses,
      confirmedDoses,
      omittedDoses,
      cancelledDoses,
      expectedDoses: source.expectedDoses,
      unrecordedDoses: source.unrecordedDoses,
      adherenceRate:
        adherenceDenominator === 0
          ? null
          : round(confirmedDoses / adherenceDenominator),
      onTimeDoses,
      punctualityRate:
        confirmedDoses === 0 ? null : round(onTimeDoses / confirmedDoses),
    };
  }

  private inventory(
    source: TreatmentInsightSource,
    asOf: Date,
    lowInventoryDays: number,
  ): TreatmentInsight['inventory'] {
    validatePositive(source.doseAmount, 'doseAmount');
    const totalAdministrationUnits = round(
      source.inventoryLots.reduce(
        (total, lot) => total + lot.quantityRemaining,
        0,
      ),
    );
    const prescribedDoseCoverage = round(
      source.inventoryLots.reduce(
        (total, lot) =>
          total + lot.quantityRemaining * lot.strengthAmount,
        0,
      ),
    );
    const estimatedDosesRemaining = round(
      prescribedDoseCoverage / source.doseAmount,
    );
    const expectedDosesPerDay = this.expectedDosesPerDay(source);
    const estimatedDaysRemaining =
      expectedDosesPerDay === null
        ? null
        : round(estimatedDosesRemaining / expectedDosesPerDay);
    const estimatedDepletionAt =
      estimatedDaysRemaining === null
        ? null
        : new Date(
            asOf.getTime() +
              estimatedDaysRemaining * 24 * 60 * 60 * 1000,
          );
    const expirations = source.inventoryLots
      .map((lot) => lot.expiresOn)
      .filter((date): date is Date => date !== null)
      .sort((left, right) => left.getTime() - right.getTime());

    return {
      totalAdministrationUnits,
      prescribedDoseCoverage,
      estimatedDosesRemaining,
      expectedDosesPerDay,
      estimatedDaysRemaining,
      estimatedDepletionAt,
      nextExpirationOn: expirations[0] ?? null,
      riskLevel: this.riskLevel(
        estimatedDosesRemaining,
        estimatedDaysRemaining,
        lowInventoryDays,
      ),
    };
  }

  private expectedDosesPerDay(source: TreatmentInsightSource): number | null {
    if (source.treatmentStatus !== 'active' || source.isAsNeeded) return null;
    if (source.frequencyIntervalHours) {
      return round(24 / source.frequencyIntervalHours);
    }
    return source.administrationTimesCount > 0
      ? source.administrationTimesCount
      : null;
  }

  private riskLevel(
    estimatedDosesRemaining: number,
    estimatedDaysRemaining: number | null,
    lowInventoryDays: number,
  ): InventoryRiskLevel {
    if (estimatedDosesRemaining <= 0) return 'critical';
    if (estimatedDaysRemaining === null) return 'unknown';
    if (estimatedDaysRemaining <= 3) return 'high';
    if (estimatedDaysRemaining <= lowInventoryDays) return 'medium';
    return 'low';
  }

  private alerts(
    source: TreatmentInsightSource,
    asOf: Date,
    lowInventoryDays: number,
    expirationWarningDays: number,
  ): TreatmentAlert[] {
    const inventory = this.inventory(source, asOf, lowInventoryDays);
    const alerts: TreatmentAlert[] = [];
    if (inventory.estimatedDosesRemaining <= 0) {
      alerts.push({
        type: 'inventory_depleted',
        severity: 'critical',
        message: 'No compatible inventory remains for this treatment',
        inventoryLotId: null,
        expiresOn: null,
      });
    } else if (
      inventory.estimatedDaysRemaining !== null &&
      inventory.estimatedDaysRemaining <= lowInventoryDays
    ) {
      alerts.push({
        type: 'inventory_low',
        severity:
          inventory.estimatedDaysRemaining <= 3 ? 'critical' : 'warning',
        message: `Compatible inventory covers approximately ${inventory.estimatedDaysRemaining} days`,
        inventoryLotId: null,
        expiresOn: null,
      });
    }

    const warningLimit = new Date(
      asOf.getTime() + expirationWarningDays * 24 * 60 * 60 * 1000,
    );
    for (const lot of source.inventoryLots) {
      if (lot.expiresOn && lot.expiresOn.getTime() <= warningLimit.getTime()) {
        alerts.push({
          type: 'inventory_expiring',
          severity:
            lot.expiresOn.getTime() < asOf.getTime()
              ? 'critical'
              : 'warning',
          message: `Inventory lot expires on ${lot.expiresOn
            .toISOString()
            .slice(0, 10)}`,
          inventoryLotId: lot.id,
          expiresOn: lot.expiresOn,
        });
      }
    }
    return alerts;
  }

  private integerWithin(
    value: number,
    label: string,
    minimum: number,
    maximum: number,
  ): number {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new Error(
        `${label} must be an integer between ${minimum} and ${maximum}`,
      );
    }
    return value;
  }
}
