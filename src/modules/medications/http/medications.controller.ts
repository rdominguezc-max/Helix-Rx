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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type {
  AuthenticatedRequestContext,
  HttpRequestWithAuth,
} from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { getRequestIp, getRequestUserAgent } from '../../auth/http/http-auth.helpers';
import { PatientAccessRequired } from '../../auth/http/patient-access-required.decorator';
import { PermissionsGuard } from '../../auth/http/permissions.guard';
import { RequiredPermissions } from '../../auth/http/required-permissions.decorator';
import { CreateMedicationUseCase } from '../application/create-medication.use-case';
import { CreatePresentationUseCase } from '../application/create-presentation.use-case';
import { CreateTreatmentUseCase } from '../application/create-treatment.use-case';
import { ListMedicationsUseCase } from '../application/list-medications.use-case';
import { ListPatientTreatmentsUseCase } from '../application/list-patient-treatments.use-case';
import { ListPresentationsUseCase } from '../application/list-presentations.use-case';
import type {
  Medication,
  MedicationPresentation,
  PatientTreatment,
} from '../domain/medication.entity';
import {
  type CreateMedicationDto,
  type CreatePresentationDto,
  type CreateTreatmentDto,
  parseOptionalDate,
  parseRequiredDate,
} from './medication.dto';

@Controller()
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class MedicationsController {
  constructor(
    @Inject(CreateMedicationUseCase)
    private readonly createMedicationUseCase: CreateMedicationUseCase,
    @Inject(ListMedicationsUseCase)
    private readonly listMedicationsUseCase: ListMedicationsUseCase,
    @Inject(CreatePresentationUseCase)
    private readonly createPresentationUseCase: CreatePresentationUseCase,
    @Inject(ListPresentationsUseCase)
    private readonly listPresentationsUseCase: ListPresentationsUseCase,
    @Inject(CreateTreatmentUseCase)
    private readonly createTreatmentUseCase: CreateTreatmentUseCase,
    @Inject(ListPatientTreatmentsUseCase)
    private readonly listPatientTreatmentsUseCase: ListPatientTreatmentsUseCase,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Post('medications')
  @RequiredPermissions('medications.write')
  @PatientAccessRequired(false)
  async createMedication(
    @Body() body: CreateMedicationDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<Medication> {
    try {
      return await this.createMedicationUseCase.execute({
        organizationId: this.organizationId(user),
        actorUserId: user?.userId,
        ...body,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get('medications')
  @RequiredPermissions('medications.read')
  @PatientAccessRequired(false)
  listMedications(
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<Medication[]> {
    return this.listMedicationsUseCase.execute(this.organizationId(user));
  }

  @Post('medications/:medicationId/presentations')
  @RequiredPermissions('medications.write')
  @PatientAccessRequired(false)
  async createPresentation(
    @Param('medicationId') medicationId: string,
    @Body() body: CreatePresentationDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<MedicationPresentation> {
    try {
      return await this.createPresentationUseCase.execute({
        organizationId: this.organizationId(user),
        medicationId,
        actorUserId: user?.userId,
        ...body,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get('medications/:medicationId/presentations')
  @RequiredPermissions('medications.read')
  @PatientAccessRequired(false)
  listPresentations(
    @Param('medicationId') medicationId: string,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<MedicationPresentation[]> {
    return this.listPresentationsUseCase.execute(
      medicationId,
      this.organizationId(user),
    );
  }

  @Post('patients/:patientId/treatments')
  @RequiredPermissions('medications.write')
  async createTreatment(
    @Param('patientId') patientId: string,
    @Body() body: CreateTreatmentDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientTreatment> {
    try {
      return await this.createTreatmentUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        actorUserId: user?.userId,
        medicationId: body.medicationId,
        prescribedBy: body.prescribedBy,
        doseAmount: body.doseAmount,
        doseUnit: body.doseUnit,
        frequencyIntervalHours: body.frequencyIntervalHours,
        administrationTimes: body.administrationTimes,
        instructions: body.instructions,
        startsOn: parseRequiredDate(body.startsOn, 'startsOn'),
        endsOn: parseOptionalDate(body.endsOn, 'endsOn'),
        isAsNeeded: body.isAsNeeded,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get('patients/:patientId/treatments')
  @RequiredPermissions('medications.read')
  async listPatientTreatments(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientTreatment[]> {
    const organizationId = this.organizationId(user);
    const treatments = await this.listPatientTreatmentsUseCase.execute(
      patientId,
      organizationId,
    );
    await this.auditService.recordEvent({
      actorUserId: user?.userId ?? null,
      organizationId,
      action: 'patient.treatment.read',
      resourceType: 'patient_treatment',
      resourceId: null,
      result: 'success',
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      metadata: { patientId, resultCount: treatments.length },
    });
    return treatments;
  }

  private organizationId(user: AuthenticatedRequestContext | null): string {
    if (!user) {
      throw new InternalServerErrorException('Authenticated context missing');
    }
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context required');
    }
    return user.organizationId;
  }

  private badRequest(error: unknown): BadRequestException {
    return new BadRequestException(
      error instanceof Error ? error.message : 'Invalid medication request',
    );
  }
}

