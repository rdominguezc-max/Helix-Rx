import { Injectable } from '@nestjs/common';
import { FindUserByIdUseCase } from '../../users/application/find-user-by-id.use-case';
import type { AuthenticatedRequestContext } from '../../auth/http/authenticated-request-context';
import type { MeProfile } from '../domain/me-profile';

@Injectable()
export class GetMeProfileUseCase {
  constructor(private readonly findUserByIdUseCase: FindUserByIdUseCase) {}

  async execute(context: AuthenticatedRequestContext): Promise<MeProfile> {
    const user = await this.findUserByIdUseCase.execute(context.userId);

    if (!user) {
      throw new Error('authenticated user not found');
    }

    return {
      userId: user.id,
      email: user.email,
      language: user.language,
      preferredLocale: user.preferredLocale,
      timezone: user.timezone,
      organization: context.organizationId
        ? {
            organizationId: context.organizationId,
          }
        : null,
    };
  }
}
