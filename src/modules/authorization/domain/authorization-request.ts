import type { PatientAuthorizationContext } from './patient-relationship';

export interface AuthorizationRequest {
  userId: string;
  organizationId: string;
  permissionCode: string;
  patientId?: string;
  patient?: PatientAuthorizationContext;
  patientAccessRequired?: boolean;
}
