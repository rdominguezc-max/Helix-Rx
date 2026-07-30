import { Injectable } from '@nestjs/common';
import type {
  DoseConversion,
  InventoryProjection,
} from '../domain/medication-inventory.entity';
import { validatePositive } from './medication.validation';

function normalizeUnit(value: string): string {
  return value.trim().toLowerCase();
}

function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

@Injectable()
export class DoseConversionService {
  convert(input: {
    prescribedDose: number;
    prescribedUnit: string;
    strengthAmount: number;
    strengthUnit: string;
    administrationUnit: string;
  }): DoseConversion {
    validatePositive(input.prescribedDose, 'prescribedDose');
    validatePositive(input.strengthAmount, 'strengthAmount');

    const prescribedUnit = normalizeUnit(input.prescribedUnit);
    const strengthUnit = normalizeUnit(input.strengthUnit);
    const administrationUnit = normalizeUnit(input.administrationUnit);

    if (!prescribedUnit || !strengthUnit || !administrationUnit) {
      throw new Error('dose conversion units are required');
    }
    if (prescribedUnit !== strengthUnit) {
      throw new Error(
        'unit conversion is not supported yet; prescribed and strength units must match',
      );
    }

    return {
      prescribedDose: input.prescribedDose,
      prescribedUnit,
      strengthAmount: input.strengthAmount,
      strengthUnit,
      administrationUnit,
      unitsPerDose: round(input.prescribedDose / input.strengthAmount),
    };
  }

  project(input: {
    totalUnitsRemaining: number;
    unitsPerDose: number;
    frequencyIntervalHours?: number | null;
    administrationTimes?: string[];
    isAsNeeded?: boolean;
    from?: Date;
  }): InventoryProjection {
    if (input.totalUnitsRemaining < 0) {
      throw new Error('totalUnitsRemaining cannot be negative');
    }
    validatePositive(input.unitsPerDose, 'unitsPerDose');

    const dosesPerDay = input.isAsNeeded
      ? 0
      : input.frequencyIntervalHours
        ? 24 / input.frequencyIntervalHours
        : (input.administrationTimes?.length ?? 0);
    const dailyUnits = round(dosesPerDay * input.unitsPerDose);

    if (dailyUnits === 0) {
      return {
        totalUnitsRemaining: input.totalUnitsRemaining,
        unitsPerDose: input.unitsPerDose,
        dosesPerDay: 0,
        dailyUnits: 0,
        daysRemaining: null,
        estimatedDepletionAt: null,
      };
    }

    const daysRemaining = round(input.totalUnitsRemaining / dailyUnits);
    const estimatedDepletionAt = new Date(
      (input.from ?? new Date()).getTime() + daysRemaining * 86_400_000,
    );

    return {
      totalUnitsRemaining: input.totalUnitsRemaining,
      unitsPerDose: input.unitsPerDose,
      dosesPerDay: round(dosesPerDay),
      dailyUnits,
      daysRemaining,
      estimatedDepletionAt,
    };
  }
}
