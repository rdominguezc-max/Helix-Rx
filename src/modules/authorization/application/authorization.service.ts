import { Inject, Injectable } from '@nestjs/common';
import {
  AUTHORIZATION_REPOSITORY,
  type AuthorizationRepository,
} from '../domain/authorization.repository';
import type { AuthorizationRequest } from '../domain/authorization-request';
import type { AuthorizationResult } from '../domain/authorization-decision';
import {
  getPatientIdFromRequest,
  getRequiredConsentScopes,
  hasRequiredPatientAccess,
  requiresPatientRelationship,
} from './authorization-policy';
import {
  normalizePermissionCode,
  validatePermissionCode,
  validateUuid,
} from './authorization.validation';

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(AUTHORIZATION_REPOSITORY)
    private readonly authorizationRepository: AuthorizationRepository,
  ) {}

  async evaluate(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const permissionCode = normalizePermissionCode(request.permissionCode);

    if (
      !validateUuid(request.userId, 'userId') ||
      !validateUuid(request.organizationId, 'organizationId') ||
      !validatePermissionCode(permissionCode)
    ) {
      return { decision: 'DENY' };
    }

    const membership =
      await this.authorizationRepository.findActiveMembershipPermissions(
        request.userId,
        request.organizationId,
      );

    if (!membership) {
      return { decision: 'DENY' };
    }

    if (!membership.permissionCodes.includes(permissionCode)) {
      return { decision: 'DENY' };
    }

    if (
      requiresPatientRelationship(permissionCode) &&
      request.patientAccessRequired !== false
    ) {
      const patientId = getPatientIdFromRequest(request);

      if (!patientId || !validateUuid(patientId, 'patientId')) {
        return { decision: 'DENY' };
      }

      const patientAccess = await this.authorizationRepository.findPatientAccess({
        userId: request.userId,
        organizationId: request.organizationId,
        patientId,
        consentScopes: getRequiredConsentScopes(permissionCode),
      });

      if (!hasRequiredPatientAccess(patientAccess)) {
        return { decision: 'DENY' };
      }
    }

    return { decision: 'ALLOW' };
  }
}
