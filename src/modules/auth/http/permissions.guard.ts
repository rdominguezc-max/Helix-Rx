import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../audit/application/audit.service';
import { AuthorizationService } from '../../authorization/application/authorization.service';
import {
  PATIENT_ACCESS_REQUIRED_METADATA_KEY,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from './http-auth.constants';
import { getRequestIp, getRequestUserAgent } from './http-auth.helpers';
import type { HttpRequestWithAuth } from './authenticated-request-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_PERMISSIONS_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<HttpRequestWithAuth>();
    const authenticatedUser = request.authenticatedUser;
    const patientAccessRequired =
      this.reflector.getAllAndOverride<boolean>(
        PATIENT_ACCESS_REQUIRED_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? true;
    const patientId = request.params?.patientId;

    if (!authenticatedUser || !authenticatedUser.organizationId) {
      await this.auditDenied(request, requiredPermissions, 'missing_auth_context');
      throw new ForbiddenException('Not authorized');
    }

    for (const permissionCode of requiredPermissions) {
      const result = await this.authorizationService.evaluate({
        userId: authenticatedUser.userId,
        organizationId: authenticatedUser.organizationId,
        permissionCode,
        patientId,
        patientAccessRequired,
      });

      if (result.decision === 'DENY') {
        await this.auditDenied(request, [permissionCode], 'permission_denied');
        throw new ForbiddenException('Not authorized');
      }
    }

    return true;
  }

  private async auditDenied(
    request: HttpRequestWithAuth,
    permissions: string[],
    reason: string,
  ): Promise<void> {
    await this.auditService.recordEvent({
      actorUserId: request.authenticatedUser?.userId ?? null,
      organizationId: request.authenticatedUser?.organizationId ?? null,
      action: 'auth.http.authorize',
      resourceType: 'authorization',
      result: 'denied',
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      metadata: {
        reason,
        permissions,
      },
    });
  }
}
