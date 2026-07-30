import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type {
  AuthenticatedRequestContext,
  HttpRequestWithAuth,
} from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { getRequestIp, getRequestUserAgent } from '../../auth/http/http-auth.helpers';
import { PermissionsGuard } from '../../auth/http/permissions.guard';
import { RequiredPermissions } from '../../auth/http/required-permissions.decorator';
import { GenerateExpectedDosesUseCase } from '../application/generate-expected-doses.use-case';
import { ListExpectedDosesUseCase } from '../application/list-expected-doses.use-case';
import type {
  ExpectedDose,
  ExpectedDoseGenerationResult,
} from '../domain/expected-dose.entity';
import {
  type GenerateExpectedDosesDto,
  type ListExpectedDosesDto,
  parseExpectedDoseDate,
  parseExpectedDoseInteger,
} from './expected-dose.dto';

@Controller('patients/:patientId/treatments/:treatmentId/expected-doses')
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class ExpectedDoseController {
  constructor(
    @Inject(GenerateExpectedDosesUseCase)
    private readonly generateExpectedDosesUseCase: GenerateExpectedDosesUseCase,
    @Inject(ListExpectedDosesUseCase)
    private readonly listExpectedDosesUseCase: ListExpectedDosesUseCase,
  ) {}

  @Post('generate')
  @RequiredPermissions('medications.write')
  async generate(
    @Param('patientId') patientId: string,
    @Param('treatmentId') treatmentId: string,
    @Body() body: GenerateExpectedDosesDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<ExpectedDoseGenerationResult> {
    try {
      return await this.generateExpectedDosesUseCase.execute({
        patientId,
        treatmentId,
        organizationId: this.organizationId(user),
        windowStartsAt: parseExpectedDoseDate(
          body.windowStartsAt,
          'windowStartsAt',
          true,
        )!,
        windowEndsAt: parseExpectedDoseDate(
          body.windowEndsAt,
          'windowEndsAt',
          true,
        )!,
        asOf: parseExpectedDoseDate(body.asOf, 'asOf'),
        missedGraceMinutes: body.missedGraceMinutes,
        actorUserId: user?.userId,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get()
  @RequiredPermissions('medications.read')
  async list(
    @Param('patientId') patientId: string,
    @Param('treatmentId') treatmentId: string,
    @Query() query: ListExpectedDosesDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<ExpectedDose[]> {
    try {
      return await this.listExpectedDosesUseCase.execute({
        patientId,
        treatmentId,
        organizationId: this.organizationId(user),
        windowStartsAt: parseExpectedDoseDate(
          query.windowStartsAt,
          'windowStartsAt',
          true,
        )!,
        windowEndsAt: parseExpectedDoseDate(
          query.windowEndsAt,
          'windowEndsAt',
          true,
        )!,
        asOf: parseExpectedDoseDate(query.asOf, 'asOf'),
        missedGraceMinutes: parseExpectedDoseInteger(
          query.missedGraceMinutes,
          'missedGraceMinutes',
        ),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  private organizationId(user: AuthenticatedRequestContext | null): string {
    if (!user) throw new InternalServerErrorException('Authenticated context missing');
    if (!user.organizationId) throw new ForbiddenException('Organization context required');
    return user.organizationId;
  }

  private badRequest(error: unknown): BadRequestException {
    return new BadRequestException(
      error instanceof Error ? error.message : 'Invalid expected dose request',
    );
  }
}
