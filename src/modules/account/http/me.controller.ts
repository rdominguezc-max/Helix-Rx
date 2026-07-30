import {
  Controller,
  Get,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type { AuthenticatedRequestContext } from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { GetMeProfileUseCase } from '../application/get-me-profile.use-case';
import type { MeProfile } from '../domain/me-profile';

@Controller('me')
export class MeController {
  constructor(private readonly getMeProfileUseCase: GetMeProfileUseCase) {}

  @Get()
  @UseGuards(FirebaseBearerAuthGuard)
  async getMe(
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
  ): Promise<MeProfile> {
    if (!authenticatedUser) {
      throw new InternalServerErrorException('Authenticated context missing');
    }

    return this.getMeProfileUseCase.execute(authenticatedUser);
  }
}
