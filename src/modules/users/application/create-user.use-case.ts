import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository';
import {
  normalizeEmail,
  normalizePersonName,
  normalizePhone,
  validateEmail,
  validateLanguage,
  validatePersonName,
  validateStatus,
  validateTimezone,
} from './user.validation';

export interface CreateUserCommand {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  language?: User['language'];
  timezone?: string;
  status?: User['status'];
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const firstName = normalizePersonName(command.firstName);
    const lastName = normalizePersonName(command.lastName);
    const email = normalizeEmail(command.email);
    const phone = normalizePhone(command.phone);
    const language = command.language ?? 'es';
    const timezone = command.timezone ?? 'America/Hermosillo';
    const status = command.status ?? 'active';

    validatePersonName(firstName, 'firstName');
    validatePersonName(lastName, 'lastName');
    validateEmail(email);
    validateLanguage(language);
    validateTimezone(timezone);
    validateStatus(status);

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('email is already in use');
    }

    return this.userRepository.create({
      firstName,
      lastName,
      email,
      phone,
      language,
      timezone,
      status,
    });
  }
}
