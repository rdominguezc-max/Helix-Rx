import type { AuditMetadata, AuditResult } from '../domain/audit-log.entity';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const actionPattern = /^[a-z][a-z0-9_.:-]*$/;
const resourceTypePattern = /^[a-z][a-z0-9_]*$/;
const allowedResults = new Set<AuditResult>(['success', 'failure', 'denied']);

export function normalizeAuditText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeOptionalText(value?: string | null): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : null;
}

export function validateOptionalUuid(
  value: string | null | undefined,
  label: string,
): void {
  if (value && !uuidPattern.test(value)) {
    throw new Error(`${label} must be a valid UUID`);
  }
}

export function validateAuditAction(action: string): void {
  const normalizedAction = normalizeAuditText(action);

  if (
    normalizedAction.length < 3 ||
    normalizedAction.length > 120 ||
    !actionPattern.test(normalizedAction)
  ) {
    throw new Error('audit action is invalid');
  }
}

export function validateResourceType(resourceType: string): void {
  const normalizedResourceType = normalizeAuditText(resourceType);

  if (
    normalizedResourceType.length < 2 ||
    normalizedResourceType.length > 80 ||
    !resourceTypePattern.test(normalizedResourceType)
  ) {
    throw new Error('audit resourceType is invalid');
  }
}

export function validateAuditResult(result: AuditResult): void {
  if (!allowedResults.has(result)) {
    throw new Error('audit result is not supported');
  }
}

export function normalizeMetadata(metadata?: AuditMetadata): AuditMetadata {
  return metadata ?? {};
}
