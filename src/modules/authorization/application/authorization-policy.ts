import type { AuthorizationRequest } from '../domain/authorization-request';
import type { PatientAccessContext } from '../domain/patient-relationship';

const patientScopedResources = new Set([
  'patients',
  'medications',
  'appointments',
  'clinical_events',
  'notifications',
  'adherence',
]);

export function requiresPatientRelationship(permissionCode: string): boolean {
  const [resource] = permissionCode.split('.');

  return patientScopedResources.has(resource);
}

export function getPatientIdFromRequest(
  request: AuthorizationRequest,
): string | null {
  return request.patientId ?? request.patient?.patientId ?? null;
}

export function getRequiredConsentScopes(permissionCode: string): string[] {
  switch (permissionCode) {
    case 'patients.read':
      return ['profile.read'];
    case 'patients.write':
      return ['profile.write'];
    case 'medications.read':
      return ['medications.read'];
    case 'medications.write':
      return ['medications.write'];
    case 'notifications.read':
      return ['notifications.read'];
    case 'notifications.write':
      return ['notifications.write'];
    case 'adherence.write':
      return ['adherence.write'];
    case 'appointments.read':
      return ['appointments.read'];
    case 'appointments.write':
      return ['appointments.write'];
    case 'clinical_events.read':
      return ['crisis_events.read', 'clinical_summary.read'];
    case 'clinical_events.write':
      return ['crisis_events.write', 'clinical_summary.write'];
    default:
      return [permissionCode];
  }
}

export function requiresConsent(access: PatientAccessContext): boolean {
  return access.relationshipType !== 'self';
}

export function hasRequiredPatientAccess(
  access: PatientAccessContext | null,
): boolean {
  if (!access) {
    return false;
  }

  if (!access.hasActiveOrganizationMembership || !access.hasActiveRelationship) {
    return false;
  }

  if (requiresConsent(access) && !access.hasActiveConsent) {
    return false;
  }

  return true;
}
