import { Injectable } from '@nestjs/common';
import type { AuthorizationRequest } from '../domain/authorization-request';
import type { AuthorizationResult } from '../domain/authorization-decision';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class EvaluateAuthorizationUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(request: AuthorizationRequest): Promise<AuthorizationResult> {
    return this.authorizationService.evaluate(request);
  }
}
