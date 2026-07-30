import type { AuthorizationMembership } from './authorization-membership';
import type { PatientAccessContext } from './patient-relationship';

export interface FindPatientAccessInput {
  userId: string;
  organizationId: string;
  patientId: string;
  consentScopes: string[];
}

export interface AuthorizationRepository {
  findActiveMembershipPermissions(
    userId: string,
    organizationId: string,
  ): Promise<AuthorizationMembership | null>;
  findPatientAccess(
    input: FindPatientAccessInput,
  ): Promise<PatientAccessContext | null>;
}

export const AUTHORIZATION_REPOSITORY = Symbol('AUTHORIZATION_REPOSITORY');
