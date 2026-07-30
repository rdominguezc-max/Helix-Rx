export interface GenerateExpectedDosesDto {
  windowStartsAt: string;
  windowEndsAt: string;
  asOf?: string;
  missedGraceMinutes?: number;
}

export interface ListExpectedDosesDto {
  windowStartsAt: string;
  windowEndsAt: string;
  asOf?: string;
  missedGraceMinutes?: string;
}

export function parseExpectedDoseDate(
  value: string | undefined,
  label: string,
  required = false,
): Date | undefined {
  if (!value) {
    if (required) throw new Error(`${label} is required`);
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be valid`);
  return date;
}

export function parseExpectedDoseInteger(
  value: string | undefined,
  label: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be an integer`);
  return Number(value);
}
