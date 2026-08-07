import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type {
  AuthenticatedRequestContext,
  HttpRequestWithAuth,
} from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { getRequestIp } from '../../auth/http/http-auth.helpers';
import {
  IsPasswordRecoveryAdministratorUseCase,
  ListPasswordRecoveryRequestsUseCase,
  RequestPasswordRecoveryUseCase,
  ResolvePasswordRecoveryRequestUseCase,
} from '../application/password-recovery.use-cases';

@Controller('password-recovery-requests')
export class PasswordRecoveryController {
  constructor(
    @Inject(RequestPasswordRecoveryUseCase)
    private readonly requestRecovery: RequestPasswordRecoveryUseCase,
    @Inject(ListPasswordRecoveryRequestsUseCase)
    private readonly listRequests: ListPasswordRecoveryRequestsUseCase,
    @Inject(ResolvePasswordRecoveryRequestUseCase)
    private readonly resolveRequest: ResolvePasswordRecoveryRequestUseCase,
    @Inject(IsPasswordRecoveryAdministratorUseCase)
    private readonly isAdministrator: IsPasswordRecoveryAdministratorUseCase,
  ) {}

  @Post()
  async create(
    @Body() body: { email?: string },
    @Req() request: HttpRequestWithAuth,
  ): Promise<{ message: string }> {
    try {
      return await this.requestRecovery.execute({
        email: body.email ?? '',
        requesterAddress: getRequestIp(request),
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Solicitud inválida',
      );
    }
  }

  @Get()
  @UseGuards(FirebaseBearerAuthGuard)
  async list(@AuthenticatedUser() user: AuthenticatedRequestContext | null) {
    await this.requireAdministrator(user);
    return this.listRequests.execute();
  }

  @Patch(':id/resolve')
  @UseGuards(FirebaseBearerAuthGuard)
  async resolve(
    @Param('id') id: string,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ) {
    await this.requireAdministrator(user);
    const resolved = await this.resolveRequest.execute(id);
    if (!resolved) throw new NotFoundException('Solicitud no encontrada');
    return resolved;
  }

  private async requireAdministrator(user: AuthenticatedRequestContext | null): Promise<void> {
    if (!user) throw new InternalServerErrorException('Authenticated context missing');
    if (!(await this.isAdministrator.execute(user.userId, user.email))) {
      throw new ForbiddenException('Administrator access required');
    }
  }
}
