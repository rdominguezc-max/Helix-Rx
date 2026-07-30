const keyPattern = /^[a-z][a-z0-9_.:-]*$/;
const codePattern = /^[a-z][a-z0-9_:-]*$/;
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

export function normalizeLocale(locale: string): string {
  const [language, region] = locale.trim().split('-');

  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

export function normalizeDescription(
  description?: string | null,
): string | null {
  const normalizedDescription = description?.trim();

  return normalizedDescription && normalizedDescription.length > 0
    ? normalizedDescription
    : null;
}

export function validateKey(key: string, label: string): void {
  const normalizedKey = normalizeKey(key);

  if (
    normalizedKey.length < 2 ||
    normalizedKey.length > 120 ||
    !keyPattern.test(normalizedKey)
  ) {
    throw new Error(`${label} is invalid`);
  }
}

export function validateCode(code: string, label: string): void {
  const normalizedCode = normalizeKey(code);

  if (
    normalizedCode.length < 2 ||
    normalizedCode.length > 80 ||
    !codePattern.test(normalizedCode)
  ) {
    throw new Error(`${label} is invalid`);
  }
}

export function validateLocale(locale: string): void {
  if (!localePattern.test(normalizeLocale(locale))) {
    throw new Error('locale is invalid');
  }
}

export function validateUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}
