import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { PatientConsent } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../domain/patient.repository';
import { recordPatientAudit } from './patient-audit';
import {
  normalizeAccessScope,
  normalizeRequiredText,
  normalizeText,
  validateAccessScope,
  validateConsentStatus,
  validateDateRange,
  validateOptionalText,
  validateOptionalUuid,
  validateRequiredText,
  validateUuid,
} from './patient.validation';

export interface AddConsentCommand {
  patientId: string;
  organizationId: string;
  consentType: string;
  scope?: string[];
  status?: PatientConsent['status'];
  subjectUserId?: string | null;
  grantedToUserId?: string | null;
  grantedToOrganizationId?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  source?: string;
  evidenceReference?: string | null;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AddConsentUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: AddConsentCommand): Promise<PatientConsent> {
    const patientId = command.patientId;
    const organizationId = command.organizationId;
    const actorUserId = command.actorUserId ?? null;
    const subjectUserId = command.subjectUserId ?? null;
    const grantedToUserId = command.grantedToUserId ?? null;
    const grantedToOrganizationId = command.grantedToOrganizationId ?? null;
    const consentType = normalizeRequiredText(command.consentType);
    const scope = normalizeAccessScope(command.scope);
    const status = command.status ?? 'active';
    const effectiveFrom = command.effectiveFrom ?? null;
    const effectiveTo = command.effectiveTo ?? null;
    const source = normalizeText(command.source) ?? 'internal';
    const evidenceReference = normalizeText(command.evidenceReference);

    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    validateOptionalUuid(actorUserId, 'actorUserId');
    validateOptionalUuid(subjectUserId, 'subjectUserId');
    validateOptionalUuid(grantedToUserId, 'grantedToUserId');
    validateOptionalUuid(grantedToOrganizationId, 'grantedToOrganizationId');
    validateRequiredText(consentType, 'consentType', 80);
    validateAccessScope(scope);
    validateConsentStatus(status);
    validateDateRange(effectiveFrom, effectiveTo, 'consent');
    validateRequiredText(source, 'source', 80);
    validateOptionalText(evidenceReference, 'evidenceReference', 200);

    await this.assertPatientOrganizationMembership(patientId, organizationId);

    const consent = await this.patientRepository.addConsent({
      patientId,
      organizationId,
      subjectUserId,
      grantedToUserId,
      grantedToOrganizationId,
      consentType,
      scope,
      status,
      effectiveFrom,
      effectiveTo,
      capturedBy: actorUserId,
      source,
      evidenceReference,
    });

    await recordPatientAudit(this.auditService, {
      actorUserId,
      organizationId,
      patientId,
      action: 'patient.consent.create',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        consentId: consent.id,
        consentType,
        status,
        scope,
      },
    });

    return consent;
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
