import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository';
import { validateUserId } from './user.validation';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<User | null> {
    validateUserId(userId);

    return this.userRepository.findById(userId);
  }
}
