import { Injectable } from '@nestjs/common';
import type { AuthenticatedUserContext } from '../domain/authenticated-user-context';
import {
  AuthenticateFirebaseUserUseCase,
  type AuthenticateFirebaseUserCommand,
} from './authenticate-firebase-user.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly authenticateFirebaseUserUseCase: AuthenticateFirebaseUserUseCase,
  ) {}

  async authenticateFirebaseUser(
    command: AuthenticateFirebaseUserCommand,
  ): Promise<AuthenticatedUserContext> {
    return this.authenticateFirebaseUserUseCase.execute(command);
  }
}
