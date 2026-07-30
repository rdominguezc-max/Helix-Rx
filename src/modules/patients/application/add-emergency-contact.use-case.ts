import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { PatientEmergencyContact } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../domain/patient.repository';
import { recordPatientAudit } from './patient-audit';
import {
  normalizeEmail,
  normalizeRequiredText,
  normalizeText,
  validateEmergencyContactStatus,
  validateLanguage,
  validateOptionalEmail,
  validateOptionalText,
  validateOptionalUuid,
  validateRequiredText,
  validateUuid,
} from './patient.validation';

export interface AddEmergencyContactCommand {
  patientId: string;
  organizationId: string;
  name: string;
  relationshipLabel: string;
  phone: string;
  email?: string | null;
  preferredLanguage?: PatientEmergencyContact['preferredLanguage'];
  priority?: number;
  canReceiveAlerts?: boolean;
  notes?: string | null;
  status?: PatientEmergencyContact['status'];
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AddEmergencyContactUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: AddEmergencyContactCommand,
  ): Promise<PatientEmergencyContact> {
    const patientId = command.patientId;
    const organizationId = command.organizationId;
    const actorUserId = command.actorUserId ?? null;
    const name = normalizeRequiredText(command.name);
    const relationshipLabel = normalizeRequiredText(command.relationshipLabel);
    const phone = normalizeRequiredText(command.phone);
    const email = normalizeEmail(command.email);
    const preferredLanguage = command.preferredLanguage ?? null;
    const priority = command.priority ?? 1;
    const canReceiveAlerts = command.canReceiveAlerts ?? false;
    const notes = normalizeText(command.notes);
    const status = command.status ?? 'active';

    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    validateOptionalUuid(actorUserId, 'actorUserId');
    validateRequiredText(name, 'name', 120);
    validateRequiredText(relationshipLabel, 'relationshipLabel', 80);
    validateRequiredText(phone, 'phone', 40);
    validateOptionalEmail(email);
    if (preferredLanguage) {
      validateLanguage(preferredLanguage);
    }
    if (!Number.isInteger(priority) || priority < 1) {
      throw new Error('priority must be a positive integer');
    }
    validateOptionalText(notes, 'notes', 500);
    validateEmergencyContactStatus(status);

    await this.assertPatientOrganizationMembership(patientId, organizationId);

    const contact = await this.patientRepository.addEmergencyContact({
      patientId,
      name,
      relationshipLabel,
      phone,
      email,
      preferredLanguage,
      priority,
      canReceiveAlerts,
      notes,
      status,
    });

    await recordPatientAudit(this.auditService, {
      actorUserId,
      organizationId,
      patientId,
      action: 'patient.emergency_contact.create',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        emergencyContactId: contact.id,
        canReceiveAlerts: contact.canReceiveAlerts,
      },
    });

    return contact;
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
