import type { HttpRequestWithAuth } from './authenticated-request-context';

export function getHeaderValue(
  request: HttpRequestWithAuth,
  headerName: string,
): string | null {
  const value = request.headers[headerName.toLowerCase()] ?? request.headers[headerName];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function extractBearerToken(request: HttpRequestWithAuth): string | null {
  const authorizationHeader = getHeaderValue(request, 'authorization');

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function getRequestIp(request: HttpRequestWithAuth): string | null {
  return request.ip ?? request.socket?.remoteAddress ?? null;
}

export function getRequestUserAgent(request: HttpRequestWithAuth): string | null {
  return getHeaderValue(request, 'user-agent');
}

export function getOrganizationId(request: HttpRequestWithAuth): string | null {
  return getHeaderValue(request, 'x-organization-id');
}
