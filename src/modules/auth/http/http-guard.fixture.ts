import type { ExecutionContext, Type } from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import type { HttpRequestWithAuth } from './authenticated-request-context';

export function buildHttpRequest(
  overrides: Partial<HttpRequestWithAuth> = {},
): HttpRequestWithAuth {
  return {
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  };
}

export function buildExecutionContext(
  request: HttpRequestWithAuth,
  handler: () => void = () => undefined,
  controller: Type<unknown> = class TestController {},
): ExecutionContext {
  const executionContext = {
    switchToHttp: () =>
      ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => undefined,
      }) as HttpArgumentsHost,
    getHandler: () => handler,
    getClass: () => controller,
    getArgs: () => [request],
    getArgByIndex: () => request,
    switchToRpc: () => {
      throw new Error('Not used');
    },
    switchToWs: () => {
      throw new Error('Not used');
    },
    getType: () => 'http',
  };

  return executionContext as ExecutionContext;
}
