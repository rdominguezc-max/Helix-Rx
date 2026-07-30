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
  validatePositiveMeasurement,
  validateRequiredText,
  validateTimezone,
  validateUuid,
} from './patient.validation';

export interface UpdatePatientProfileCommand {
  patientId: string;
  organizationId: string;
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
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class UpdatePatientProfileUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: UpdatePatientProfileCommand): Promise<Patient> {
    const patientId = command.patientId;
    const organizationId = command.organizationId;
    const actorUserId = command.actorUserId ?? null;
    const firstName = normalizeRequiredText(command.firstName);
    const lastName = normalizeRequiredText(command.lastName);
    const phone = normalizeText(command.phone);
    const email = normalizeEmail(command.email);
    const countryCode = normalizeCountryCode(command.countryCode);
    const bloodType = normalizeText(command.bloodType);
    const language = command.language ?? 'es';
    const preferredLocale = command.preferredLocale ?? 'es-MX';
    const timezone = command.timezone ?? 'America/Hermosillo';
    const birthDate = command.birthDate ?? null;
    const administrativeSex = command.administrativeSex ?? null;
    const heightCm = command.heightCm ?? null;
    const weightKg = command.weightKg ?? null;

    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    validateOptionalUuid(actorUserId, 'actorUserId');
    validateRequiredText(firstName, 'firstName', 80);
    validateRequiredText(lastName, 'lastName', 80);
    validateOptionalText(phone, 'phone', 40);
    validateOptionalEmail(email);
    validateOptionalText(countryCode, 'countryCode', 2);
    validateOptionalText(bloodType, 'bloodType', 12);
    validateLanguage(language);
    validateLocale(preferredLocale);
    validateTimezone(timezone);
    validateBirthDate(birthDate);
    validateAdministrativeSex(administrativeSex);
    validatePositiveMeasurement(heightCm, 'heightCm');
    validatePositiveMeasurement(weightKg, 'weightKg');

    await this.assertPatientOrganizationMembership(patientId, organizationId);

    const patient = await this.patientRepository.updateProfile({
      patientId,
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
    });

    if (!patient) {
      throw new Error('patient not found');
    }

    await recordPatientAudit(this.auditService, {
      actorUserId,
      organizationId,
      patientId,
      action: 'patient.profile.update',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    return patient;
  }

  private async assertPatientOrganizationMembership(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const membership =
      await this.patientRepository.findActiveOrganizationMembership(
        patientId,
        organizationId,
      );

    if (!membership) {
      throw new Error('patient is not active in organization');
    }
  }
}
