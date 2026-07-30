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
  Put,
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
import { ClaimNotificationJobsUseCase } from '../application/claim-notification-jobs.use-case';
import { GetNotificationPreferenceUseCase } from '../application/get-notification-preference.use-case';
import { PrepareNotificationJobsUseCase } from '../application/prepare-notification-jobs.use-case';
import { RecordNotificationDeliveryUseCase } from '../application/record-notification-delivery.use-case';
import { SetNotificationPreferenceUseCase } from '../application/set-notification-preference.use-case';
import type {
  NotificationDeliveryEvent,
  NotificationJob,
  PatientNotificationPreference,
} from '../domain/notification.entity';
import {
  type ClaimNotificationJobsDto,
  type PrepareNotificationJobsDto,
  type RecordNotificationDeliveryDto,
  type SetNotificationPreferenceDto,
  parseNotificationDate,
} from './notification.dto';

@Controller('patients/:patientId/notifications')
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class NotificationController {
  constructor(
    @Inject(SetNotificationPreferenceUseCase)
    private readonly setPreferenceUseCase: SetNotificationPreferenceUseCase,
    @Inject(GetNotificationPreferenceUseCase)
    private readonly getPreferenceUseCase: GetNotificationPreferenceUseCase,
    @Inject(PrepareNotificationJobsUseCase)
    private readonly prepareJobsUseCase: PrepareNotificationJobsUseCase,
    @Inject(ClaimNotificationJobsUseCase)
    private readonly claimJobsUseCase: ClaimNotificationJobsUseCase,
    @Inject(RecordNotificationDeliveryUseCase)
    private readonly recordDeliveryUseCase: RecordNotificationDeliveryUseCase,
  ) {}

  @Put('preference')
  @RequiredPermissions('medications.write')
  async setPreference(
    @Param('patientId') patientId: string,
    @Body() body: SetNotificationPreferenceDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientNotificationPreference> {
    try {
      return await this.setPreferenceUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        enabledChannels: body.enabledChannels,
        reminderLeadMinutes: body.reminderLeadMinutes,
        status: body.status,
        actorUserId: user?.userId,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get('preference')
  @RequiredPermissions('medications.read')
  getPreference(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<PatientNotificationPreference | null> {
    return this.getPreferenceUseCase.execute(
      patientId,
      this.organizationId(user),
    );
  }

  @Post('jobs/prepare')
  @RequiredPermissions('medications.write')
  async prepareJobs(
    @Param('patientId') patientId: string,
    @Body() body: PrepareNotificationJobsDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<NotificationJob[]> {
    try {
      return await this.prepareJobsUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        windowStartsAt: parseNotificationDate(
          body.windowStartsAt,
          'windowStartsAt',
          true,
        )!,
        windowEndsAt: parseNotificationDate(
          body.windowEndsAt,
          'windowEndsAt',
          true,
        )!,
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Post('jobs/claim')
  @RequiredPermissions('medications.write')
  async claimJobs(
    @Param('patientId') patientId: string,
    @Body() body: ClaimNotificationJobsDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<NotificationJob[]> {
    try {
      return await this.claimJobsUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        workerId: body.workerId,
        asOf: parseNotificationDate(body.asOf, 'asOf'),
        limit: body.limit,
        leaseSeconds: body.leaseSeconds,
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Post('jobs/:notificationJobId/deliveries')
  @RequiredPermissions('medications.write')
  async recordDelivery(
    @Param('patientId') patientId: string,
    @Param('notificationJobId') notificationJobId: string,
    @Body() body: RecordNotificationDeliveryDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<NotificationDeliveryEvent> {
    try {
      return await this.recordDeliveryUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        notificationJobId,
        claimToken: body.claimToken,
        provider: body.provider,
        deliveryStatus: body.deliveryStatus,
        providerMessageId: body.providerMessageId,
        errorCode: body.errorCode,
        detail: body.detail,
        occurredAt:
          parseNotificationDate(body.occurredAt, 'occurredAt') ?? null,
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
      error instanceof Error ? error.message : 'Invalid notification request',
    );
  }
}
