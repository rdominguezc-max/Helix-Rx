export interface CreateMedicationDto {
  genericName: string;
  activeIngredient: string;
  medicationForm: string;
  route: string;
}

export interface CreatePresentationDto {
  brandName?: string | null;
  manufacturer?: string | null;
  strengthAmount: number;
  strengthUnit: string;
  administrationUnit: string;
  packageQuantity: number;
  countryCode?: string | null;
}

export interface CreateTreatmentDto {
  medicationId: string;
  prescribedBy?: string | null;
  doseAmount: number;
  doseUnit: string;
  frequencyIntervalHours?: number | null;
  administrationTimes?: string[];
  instructions?: string | null;
  startsOn: string;
  endsOn?: string | null;
  isAsNeeded?: boolean;
}

export function parseRequiredDate(value: string, label: string): Date {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date`);
  }
  return date;
}

export function parseOptionalDate(
  value: string | null | undefined,
  label: string,
): Date | null {
  if (!value) return null;
  return parseRequiredDate(value, label);
}
