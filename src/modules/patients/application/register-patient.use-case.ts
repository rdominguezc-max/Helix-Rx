import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { Patient } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientProfileData,
  type PatientRepository,
} from '../domain/patient.repository';
import { recordPatientAudit } from './patient-audit';
import {
  normalizeCountryCode,
  normalizeEmail,
  normalizeRequiredText,
  normalizeText,
  validateAdministrativeSex,
  validateBirthDate,
  validateLanguage,
  validateLocale,
  validateOptionalEmail,
  validateOptionalText,
  validateOptionalUuid,
  validatePatientStatus,
  validatePositiveMeasurement,
  validateRequiredText,
  validateTimezone,
  validateUuid,
} from './patient.validation';

export interface RegisterPatientCommand {
  organizationId: string;
  userId?: string | null;
  externalReference?: string | null;
  firstName: string;
  lastName: string;
  birthDate?: Date | null;
  administrativeSex?: PatientProfileData['administrativeSex'];
  phone?: string | null;
  email?: string | null;
  countryCode?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  language?: PatientProfileData['language'];
  preferredLocale?: string;
  timezone?: string;
  status?: Patient['status'];
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class RegisterPatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RegisterPatientCommand): Promise<Patient> {
    const organizationId = command.organizationId;
    const userId = command.userId ?? null;
    const actorUserId = command.actorUserId ?? null;
    const externalReference = normalizeText(command.externalReference);
    const firstName = normalizeRequiredText(command.firstName);
    const lastName = normalizeRequiredText(command.lastName);
    const phone = normalizeText(command.phone);
    const email = normalizeEmail(command.email);
    const countryCode = normalizeCountryCode(command.countryCode);
    const bloodType = normalizeText(command.bloodType);
    const language = command.language ?? 'es';
    const preferredLocale = command.preferredLocale ?? 'es-MX';
    const timezone = command.timezone ?? 'America/Hermosillo';
    const status = command.status ?? 'active';
    const birthDate = command.birthDate ?? null;
    const administrativeSex = command.administrativeSex ?? null;
    const heightCm = command.heightCm ?? null;
    const weightKg = command.weightKg ?? null;

    validateUuid(organizationId, 'organizationId');
    validateOptionalUuid(userId, 'userId');
    validateOptionalUuid(actorUserId, 'actorUserId');
    validateOptionalText(externalReference, 'externalReference', 160);
    validateRequiredText(firstName, 'firstName', 80);
    validateRequiredText(lastName, 'lastName', 80);
    validateOptionalText(phone, 'phone', 40);
    validateOptionalEmail(email);
    validateOptionalText(countryCode, 'countryCode', 2);
    validateOptionalText(bloodType, 'bloodType', 12);
    validateLanguage(language);
    validateLocale(preferredLocale);
    validateTimezone(timezone);
    validatePatientStatus(status);
    validateBirthDate(birthDate);
    validateAdministrativeSex(administrativeSex);
    validatePositiveMeasurement(heightCm, 'heightCm');
    validatePositiveMeasurement(weightKg, 'weightKg');

    const result = await this.patientRepository.register({
      organizationId,
      userId,
      externalReference,
      status,
      profile: {
        firstName,
        lastName,
        birthDate,
        administrativeSex,
        phone,
        email,
        countryCode,
        bloodType,
        heightCm,
        weightKg,
        language,
        preferredLocale,
        timezone,
      },
      registeredBy: actorUserId,
    });

    await recordPatientAudit(this.auditService, {
      actorUserId,
      organizationId,
      patientId: result.patient.id,
      action: 'patient.create',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        eventName: result.event.name,
        patientOrganizationMembershipId:
          result.event.patientOrganizationMembershipId,
        hasLinkedUser: result.event.hasLinkedUser,
      },
    });

    return result.patient;
  }
}
