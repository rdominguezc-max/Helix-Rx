import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository';
import { normalizeEmail, validateEmail } from './user.validation';

@Injectable()
export class FindUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);

    validateEmail(normalizedEmail);

    return this.userRepository.findByEmail(normalizedEmail);
  }
}
