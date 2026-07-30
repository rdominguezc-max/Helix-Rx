import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequestContext,
  HttpRequestWithAuth,
} from './authenticated-request-context';

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestContext | null => {
    const request = context.switchToHttp().getRequest<HttpRequestWithAuth>();

    return request.authenticatedUser ?? null;
  },
);
