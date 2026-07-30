import type { RoleStatus } from '../domain/role.entity';

const roleCodePattern = /^[a-z][a-z0-9_]*$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedStatuses = new Set<RoleStatus>(['active', 'inactive']);

export function normalizeRoleCode(code: string): string {
  return code.trim().toLowerCase();
}

export function normalizeRoleName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeRoleDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ');
}

export function validateRoleCode(code: string): void {
  const normalizedCode = normalizeRoleCode(code);

  if (
    normalizedCode.length < 3 ||
    normalizedCode.length > 80 ||
    !roleCodePattern.test(normalizedCode)
  ) {
    throw new Error('role code must contain lowercase letters, numbers, or underscores');
  }
}

export function validateRoleName(name: string): void {
  const normalizedName = normalizeRoleName(name);

  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new Error('role name must be between 2 and 120 characters');
  }
}

export function validateRoleDescription(description: string): void {
  const normalizedDescription = normalizeRoleDescription(description);

  if (normalizedDescription.length < 3 || normalizedDescription.length > 240) {
    throw new Error('role description must be between 3 and 240 characters');
  }
}

export function validateRoleStatus(status: RoleStatus): void {
  if (!allowedStatuses.has(status)) {
    throw new Error('role status is not supported');
  }
}

export function validateUuid(value: string, label: string): void {
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}
