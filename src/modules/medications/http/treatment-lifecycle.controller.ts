import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type { AuthenticatedRequestContext, HttpRequestWithAuth } from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { getRequestIp, getRequestUserAgent } from '../../auth/http/http-auth.helpers';
import { PermissionsGuard } from '../../auth/http/permissions.guard';
import { RequiredPermissions } from '../../auth/http/required-permissions.decorator';
import { ChangeTreatmentStatusUseCase } from '../application/change-treatment-status.use-case';
import { ListDoseEventsUseCase } from '../application/list-dose-events.use-case';
import { RecordDoseEventUseCase } from '../application/record-dose-event.use-case';
import type { MedicationDoseEvent, TreatmentStatusEvent } from '../domain/treatment-lifecycle.entity';
import { type ChangeTreatmentStatusDto, type RecordDoseEventDto, parseLifecycleDate } from './treatment-lifecycle.dto';

@Controller('patients/:patientId/treatments/:treatmentId')
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class TreatmentLifecycleController {
  constructor(
    @Inject(ChangeTreatmentStatusUseCase) private readonly changeTreatmentStatusUseCase: ChangeTreatmentStatusUseCase,
    @Inject(RecordDoseEventUseCase) private readonly recordDoseEventUseCase: RecordDoseEventUseCase,
    @Inject(ListDoseEventsUseCase) private readonly listDoseEventsUseCase: ListDoseEventsUseCase,
  ) {}

  @Patch('status')
  @RequiredPermissions('medications.write')
  async changeStatus(@Param('patientId') patientId: string, @Param('treatmentId') treatmentId: string, @Body() body: ChangeTreatmentStatusDto, @AuthenticatedUser() user: AuthenticatedRequestContext | null, @Req() request: HttpRequestWithAuth): Promise<TreatmentStatusEvent> {
    try {
      return await this.changeTreatmentStatusUseCase.execute({ patientId, treatmentId, organizationId: this.organizationId(user), actorUserId: user?.userId, newStatus: body.newStatus, reason: body.reason, ipAddress: getRequestIp(request), userAgent: getRequestUserAgent(request) });
    } catch (error) { throw this.badRequest(error); }
  }

  @Post('dose-events')
  @RequiredPermissions('medications.write')
  async recordDoseEvent(@Param('patientId') patientId: string, @Param('treatmentId') treatmentId: string, @Body() body: RecordDoseEventDto, @AuthenticatedUser() user: AuthenticatedRequestContext | null, @Req() request: HttpRequestWithAuth): Promise<MedicationDoseEvent> {
    try {
      return await this.recordDoseEventUseCase.execute({ patientId, treatmentId, organizationId: this.organizationId(user), actorUserId: user?.userId, scheduledFor: parseLifecycleDate(body.scheduledFor, 'scheduledFor', true)!, eventStatus: body.eventStatus, occurredAt: parseLifecycleDate(body.occurredAt, 'occurredAt'), omissionReason: body.omissionReason, idempotencyKey: body.idempotencyKey, ipAddress: getRequestIp(request), userAgent: getRequestUserAgent(request) });
    } catch (error) { throw this.badRequest(error); }
  }

  @Get('dose-events')
  @RequiredPermissions('medications.read')
  listDoseEvents(@Param('patientId') patientId: string, @Param('treatmentId') treatmentId: string, @AuthenticatedUser() user: AuthenticatedRequestContext | null): Promise<MedicationDoseEvent[]> {
    return this.listDoseEventsUseCase.execute(patientId, this.organizationId(user), treatmentId);
  }

  private organizationId(user: AuthenticatedRequestContext | null): string {
    if (!user) throw new InternalServerErrorException('Authenticated context missing');
    if (!user.organizationId) throw new ForbiddenException('Organization context required');
    return user.organizationId;
  }

  private badRequest(error: unknown): BadRequestException {
    return new BadRequestException(error instanceof Error ? error.message : 'Invalid treatment request');
  }
}