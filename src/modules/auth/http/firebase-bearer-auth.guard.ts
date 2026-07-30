import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import { AuthService } from '../application/auth.service';
import {
  extractBearerToken,
  getOrganizationId,
  getRequestIp,
  getRequestUserAgent,
} from './http-auth.helpers';
import type { HttpRequestWithAuth } from './authenticated-request-context';

@Injectable()
export class FirebaseBearerAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpRequestWithAuth>();
    const idToken = extractBearerToken(request);

    if (!idToken) {
      await this.auditAuthenticationFailure(request, 'missing_bearer_token');
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const authenticatedUser = await this.authService.authenticateFirebaseUser({
        idToken,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });

      request.authenticatedUser = {
        ...authenticatedUser,
        organizationId: getOrganizationId(request),
      };

      return true;
    } catch {
      await this.auditAuthenticationFailure(
        request,
        'firebase_bearer_auth_failed',
      );
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async auditAuthenticationFailure(
    request: HttpRequestWithAuth,
    reason: string,
  ): Promise<void> {
    await this.auditService.recordEvent({
      action: 'auth.http.authenticate',
      resourceType: 'auth',
      result: 'failure',
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      metadata: {
        reason,
      },
    });
  }
}
