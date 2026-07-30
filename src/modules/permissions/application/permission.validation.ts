import type { PermissionStatus } from '../domain/permission.entity';

const permissionCodePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const permissionPartPattern = /^[a-z][a-z0-9_]*$/;
const allowedStatuses = new Set<PermissionStatus>(['active', 'inactive']);

export function normalizePermissionCode(code: string): string {
  return code.trim().toLowerCase();
}

export function normalizePermissionPart(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePermissionDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ');
}

export function validatePermissionCode(code: string): void {
  const normalizedCode = normalizePermissionCode(code);

  if (
    normalizedCode.length < 5 ||
    normalizedCode.length > 120 ||
    !permissionCodePattern.test(normalizedCode)
  ) {
    throw new Error('permission code must follow resource.action format');
  }
}

export function validatePermissionPart(value: string, label: string): void {
  const normalizedValue = normalizePermissionPart(value);

  if (
    normalizedValue.length < 2 ||
    normalizedValue.length > 60 ||
    !permissionPartPattern.test(normalizedValue)
  ) {
    throw new Error(`${label} must contain lowercase letters, numbers, or underscores`);
  }
}

export function validatePermissionDescription(description: string): void {
  const normalizedDescription = normalizePermissionDescription(description);

  if (normalizedDescription.length < 3 || normalizedDescription.length > 180) {
    throw new Error('permission description must be between 3 and 180 characters');
  }
}

export function validatePermissionStatus(status: PermissionStatus): void {
  if (!allowedStatuses.has(status)) {
    throw new Error('permission status is not supported');
  }
}

export function splitPermissionCode(code: string): {
  resource: string;
  action: string;
} {
  const normalizedCode = normalizePermissionCode(code);
  const [resource, action] = normalizedCode.split('.');

  return { resource, action };
}
