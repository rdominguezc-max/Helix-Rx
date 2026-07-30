const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) throw new Error(`${label} must be a valid UUID`);
}

export function normalizeRequiredText(value: string, label: string): string {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length > 160) {
    throw new Error(`${label} must be between 1 and 160 characters`);
  }
  return normalized;
}

export function normalizeOptionalText(
  value: string | null | undefined,
  label: string,
): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ') || null;
  if (normalized && normalized.length > 500) {
    throw new Error(`${label} must be 500 characters or fewer`);
  }
  return normalized;
}

export function validatePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive`);
  }
}

export function normalizeAdministrationTimes(times?: string[]): string[] {
  const normalized = [...new Set(times?.map((time) => time.trim()) ?? [])];
  if (normalized.some((time) => !timePattern.test(time))) {
    throw new Error('administrationTimes must use HH:mm 24-hour format');
  }
  return normalized.sort();
}

export function validateTreatmentSchedule(input: {
  isAsNeeded: boolean;
  frequencyIntervalHours: number | null;
  administrationTimes: string[];
}): void {
  if (
    !input.isAsNeeded &&
    input.frequencyIntervalHours === null &&
    input.administrationTimes.length === 0
  ) {
    throw new Error(
      'treatment requires frequencyIntervalHours, administrationTimes or isAsNeeded',
    );
  }
  if (input.frequencyIntervalHours !== null) {
    validatePositive(input.frequencyIntervalHours, 'frequencyIntervalHours');
  }
}

export function validateDateRange(
  startsOn: Date,
  endsOn: Date | null,
): void {
  if (
    Number.isNaN(startsOn.getTime()) ||
    (endsOn && Number.isNaN(endsOn.getTime()))
  ) {
    throw new Error('treatment dates must be valid');
  }
  if (endsOn && endsOn.getTime() < startsOn.getTime()) {
    throw new Error('endsOn cannot be before startsOn');
  }
}
