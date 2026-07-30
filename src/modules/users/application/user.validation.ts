import type { UserLanguage, UserStatus } from '../domain/user.entity';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timezonePattern = /^[A-Za-z]+(?:[_-][A-Za-z]+)*\/[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedStatuses = new Set<UserStatus>([
  'active',
  'inactive',
  'suspended',
]);

const allowedLanguages = new Set<UserLanguage>(['es', 'en']);

export function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string | null): string | null {
  const normalizedPhone = phone?.trim();

  return normalizedPhone && normalizedPhone.length > 0 ? normalizedPhone : null;
}

export function validateUserId(userId: string): void {
  if (!uuidPattern.test(userId)) {
    throw new Error('userId must be a valid UUID');
  }
}

export function validatePersonName(name: string, label: string): void {
  const normalizedName = normalizePersonName(name);

  if (normalizedName.length < 1 || normalizedName.length > 80) {
    throw new Error(`${label} must be between 1 and 80 characters`);
  }
}

export function validateEmail(email: string): void {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    throw new Error('email must be valid');
  }
}

export function validateLanguage(language: UserLanguage): void {
  if (!allowedLanguages.has(language)) {
    throw new Error('language is not supported');
  }
}

export function validateStatus(status: UserStatus): void {
  if (!allowedStatuses.has(status)) {
    throw new Error('status is not supported');
  }
}

export function validateTimezone(timezone: string): void {
  const normalizedTimezone = timezone.trim();

  if (
    normalizedTimezone.length < 3 ||
    normalizedTimezone.length > 80 ||
    !timezonePattern.test(normalizedTimezone)
  ) {
    throw new Error('timezone must be a valid IANA timezone identifier');
  }
}
