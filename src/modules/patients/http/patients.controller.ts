import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
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
import { AddCareRelationshipUseCase } from '../application/add-care-relationship.use-case';
import { AddConsentUseCase } from '../application/add-consent.use-case';
import { AddEmergencyContactUseCase } from '../application/add-emergency-contact.use-case';
import { FindPatientByIdUseCase } from '../application/find-patient-by-id.use-case';
import { ListCareRelationshipsUseCase } from '../application/list-care-relationships.use-case';
import { ListConsentsUseCase } from '../application/list-consents.use-case';
import { ListEmergencyContactsUseCase } from '../application/list-emergency-contacts.use-case';
import { RegisterPatientUseCase } from '../application/register-patient.use-case';
import { UpdatePatientProfileUseCase } from '../application/update-patient-profile.use-case';
import type {
  Patient,
  PatientCareRelationship,
  PatientConsent,
  PatientEmergencyContact,
} from '../domain/patient.entity';
import {
  type AddCareRelationshipDto,
  type AddConsentDto,
  type AddEmergencyContactDto,
  type RegisterPatientDto,
  type UpdatePatientProfileDto,
  parseOptionalDate,
} from './patient.dto';

@Controller('patients')
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(
    @Inject(RegisterPatientUseCase)
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    @Inject(FindPatientByIdUseCase)
    private readonly findPatientByIdUseCase: FindPatientByIdUseCase,
    @Inject(UpdatePatientProfileUseCase)
    private readonly updatePatientProfileUseCase: UpdatePatientProfileUseCase,
    @Inject(AddCareRelationshipUseCase)
    private readonly addCareRelationshipUseCase: AddCareRelationshipUseCase,
    @Inject(AddEmergencyContactUseCase)
    private readonly addEmergencyContactUseCase: AddEmergencyContactUseCase,
    @Inject(AddConsentUseCase)
    private readonly addConsentUseCase: AddConsentUseCase,
    @Inject(ListCareRelationshipsUseCase)
    private readonly listCareRelationshipsUseCase: ListCareRelationshipsUseCase,
    @Inject(ListEmergencyContactsUseCase)
    private readonly listEmergencyContactsUseCase: ListEmergencyContactsUseCase,
    @Inject(ListConsentsUseCase)
    private readonly listConsentsUseCase: ListConsentsUseCase,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @RequiredPermissions('patients.write')
  @PatientAccessRequired(false)
  async registerPatient(
    @Body() body: RegisterPatientDto = {} as RegisterPatientDto,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<Patient> {
    const organizationId = this.getOrganizationId(authenticatedUser);

    try {
      return await this.registerPatientUseCase.execute({
        organizationId,
        actorUserId: authenticatedUser?.userId ?? null,
        userId: body.userId,
        externalReference: body.externalReference,
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: parseOptionalDate(body.birthDate),
        administrativeSex: body.administrativeSex,
        phone: body.phone,
        email: body.email,
        countryCode: body.countryCode,
        bloodType: body.bloodType,
        heightCm: body.heightCm,
        weightKg: body.weightKg,
        language: body.language,
        preferredLocale: body.preferredLocale,
        timezone: body.timezone,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.toBadRequest(error);
    }
  }

  @Get(':patientId')
  @RequiredPermissions('patients.read')
  async findPatient(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<Patient> {
    const organizationId = this.getOrganizationId(authenticatedUser);
    const patient = await this.findPatientByIdUseCase.execute(patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.auditService.recordEvent({
      actorUserId: authenticatedUser?.userId ?? null,
      organizationId,
      action: 'patient.read',
      resourceType: 'patient',
      resourceId: patientId,
      result: 'success',
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      metadata: {},
    });

    return patient;
  }

  @Patch(':patientId/profile')
  @RequiredPermissions('patients.write')
  async updatePatientProfile(
    @Param('patientId') patientId: string,
    @Body() body: UpdatePatientProfileDto = {} as UpdatePatientProfileDto,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<Patient> {
    const organizationId = this.getOrganizationId(authenticatedUser);

    try {
      return await this.updatePatientProfileUseCase.execute({
        patientId,
        organizationId,
        actorUserId: authenticatedUser?.userId ?? null,
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: parseOptionalDate(body.birthDate),
        administrativeSex: body.administrativeSex,
        phone: body.phone,
        email: body.email,
        countryCode: body.countryCode,
        bloodType: body.bloodType,
        heightCm: body.heightCm,
        weightKg: body.weightKg,
        language: body.language,
        preferredLocale: body.preferredLocale,
        timezone: body.timezone,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'patient not found') {
        throw new NotFoundException('Patient not found');
      }

      throw this.toBadRequest(error);
    }
  }

  @Post(':patientId/care-relationships')
  @RequiredPermissions('patients.write')
  async addCareRelationship(
    @Param('patientId') patientId: string,
    @Body() body: AddCareRelationshipDto = {} as AddCareRelationshipDto,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientCareRelationship> {
    const organizationId = this.getOrganizationId(authenticatedUser);

    try {
      return await this.addCareRelationshipUseCase.execute({
        patientId,
        organizationId,
        actorUserId: authenticatedUser?.userId ?? null,
        relatedUserId: body.relatedUserId,
        relationshipType: body.relationshipType,
        accessScope: body.accessScope,
        startsAt: parseOptionalDate(body.startsAt),
        endsAt: parseOptionalDate(body.endsAt),
        status: body.status,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.toBadRequest(error);
    }
  }

  @Get(':patientId/care-relationships')
  @RequiredPermissions('patients.read')
  async listCareRelationships(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientCareRelationship[]> {
    const organizationId = this.getOrganizationId(authenticatedUser);
    const relationships = await this.listCareRelationshipsUseCase.execute({
      patientId,
      organizationId,
    });

    await this.auditPatientRead({
      authenticatedUser,
      organizationId,
      patientId,
      action: 'patient.care_relationship.read',
      request,
    });

    return relationships;
  }

  @Post(':patientId/emergency-contacts')
  @RequiredPermissions('patients.write')
  async addEmergencyContact(
    @Param('patientId') patientId: string,
    @Body() body: AddEmergencyContactDto = {} as AddEmergencyContactDto,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientEmergencyContact> {
    const organizationId = this.getOrganizationId(authenticatedUser);

    try {
      return await this.addEmergencyContactUseCase.execute({
        patientId,
        organizationId,
        actorUserId: authenticatedUser?.userId ?? null,
        name: body.name,
        relationshipLabel: body.relationshipLabel,
        phone: body.phone,
        email: body.email,
        preferredLanguage: body.preferredLanguage,
        priority: body.priority,
        canReceiveAlerts: body.canReceiveAlerts,
        notes: body.notes,
        status: body.status,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.toBadRequest(error);
    }
  }

  @Get(':patientId/emergency-contacts')
  @RequiredPermissions('patients.read')
  async listEmergencyContacts(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientEmergencyContact[]> {
    const organizationId = this.getOrganizationId(authenticatedUser);
    const contacts = await this.listEmergencyContactsUseCase.execute({
      patientId,
      organizationId,
    });

    await this.auditPatientRead({
      authenticatedUser,
      organizationId,
      patientId,
      action: 'patient.emergency_contact.read',
      request,
    });

    return contacts;
  }

  @Post(':patientId/consents')
  @RequiredPermissions('patients.write')
  async addConsent(
    @Param('patientId') patientId: string,
    @Body() body: AddConsentDto = {} as AddConsentDto,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientConsent> {
    const organizationId = this.getOrganizationId(authenticatedUser);

    try {
      return await this.addConsentUseCase.execute({
        patientId,
        organizationId,
        actorUserId: authenticatedUser?.userId ?? null,
        subjectUserId: body.subjectUserId,
        grantedToUserId: body.grantedToUserId,
        grantedToOrganizationId: body.grantedToOrganizationId,
        consentType: body.consentType,
        scope: body.scope,
        status: body.status,
        effectiveFrom: parseOptionalDate(body.effectiveFrom),
        effectiveTo: parseOptionalDate(body.effectiveTo),
        source: body.source,
        evidenceReference: body.evidenceReference,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.toBadRequest(error);
    }
  }

  @Get(':patientId/consents')
  @RequiredPermissions('patients.read')
  async listConsents(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() authenticatedUser: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<PatientConsent[]> {
    const organizationId = this.getOrganizationId(authenticatedUser);
    const consents = await this.listConsentsUseCase.execute({
      patientId,
      organizationId,
    });

    await this.auditPatientRead({
      authenticatedUser,
      organizationId,
      patientId,
      action: 'patient.consent.read',
      request,
    });

    return consents;
  }

  private getOrganizationId(
    authenticatedUser: AuthenticatedRequestContext | null,
  ): string {
    if (!authenticatedUser) {
      throw new InternalServerErrorException('Authenticated context missing');
    }

    if (!authenticatedUser.organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    return authenticatedUser.organizationId;
  }

  private toBadRequest(error: unknown): BadRequestException {
    return new BadRequestException(
      error instanceof Error ? error.message : 'Invalid patient request',
    );
  }

  private async auditPatientRead(input: {
    authenticatedUser: AuthenticatedRequestContext | null;
    organizationId: string;
    patientId: string;
    action: string;
    request: HttpRequestWithAuth;
  }): Promise<void> {
    await this.auditService.recordEvent({
      actorUserId: input.authenticatedUser?.userId ?? null,
      organizationId: input.organizationId,
      action: input.action,
      resourceType: 'patient',
      resourceId: input.patientId,
      result: 'success',
      ipAddress: getRequestIp(input.request),
      userAgent: getRequestUserAgent(input.request),
      metadata: {},
    });
  }
}
