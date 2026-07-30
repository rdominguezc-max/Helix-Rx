import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository';
import {
  normalizePersonName,
  normalizePhone,
  validateLanguage,
  validatePersonName,
  validateTimezone,
  validateUserId,
} from './user.validation';

export interface UpdateBasicProfileCommand {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  language: User['language'];
  timezone: string;
}

@Injectable()
export class UpdateBasicProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateBasicProfileCommand): Promise<User> {
    const firstName = normalizePersonName(command.firstName);
    const lastName = normalizePersonName(command.lastName);
    const phone = normalizePhone(command.phone);
    const timezone = command.timezone.trim();

    validateUserId(command.userId);
    validatePersonName(firstName, 'firstName');
    validatePersonName(lastName, 'lastName');
    validateLanguage(command.language);
    validateTimezone(timezone);

    const user = await this.userRepository.updateBasicProfile({
      userId: command.userId,
      firstName,
      lastName,
      phone,
      language: command.language,
      timezone,
    });

    if (!user) {
      throw new Error('user not found');
    }

    return user;
  }
}
