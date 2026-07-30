import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type { PatientCareRelationship } from '../domain/patient.entity';
import {
  PATIENT_REPOSITORY,
  type PatientRepository,
} from '../domain/patient.repository';
import { recordPatientAudit } from './patient-audit';
import {
  normalizeAccessScope,
  validateAccessScope,
  validateCareRelationshipStatus,
  validateCareRelationshipType,
  validateDateRange,
  validateOptionalUuid,
  validateUuid,
} from './patient.validation';

export interface AddCareRelationshipCommand {
  patientId: string;
  organizationId: string;
  relatedUserId: string;
  relationshipType: PatientCareRelationship['relationshipType'];
  accessScope?: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  status?: PatientCareRelationship['status'];
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AddCareRelationshipUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: AddCareRelationshipCommand,
  ): Promise<PatientCareRelationship> {
    const patientId = command.patientId;
    const organizationId = command.organizationId;
    const relatedUserId = command.relatedUserId;
    const actorUserId = command.actorUserId ?? null;
    const relationshipType = command.relationshipType;
    const accessScope = normalizeAccessScope(command.accessScope);
    const startsAt = command.startsAt ?? null;
    const endsAt = command.endsAt ?? null;
    const status = command.status ?? 'active';

    validateUuid(patientId, 'patientId');
    validateUuid(organizationId, 'organizationId');
    validateUuid(relatedUserId, 'relatedUserId');
    validateOptionalUuid(actorUserId, 'actorUserId');
    validateCareRelationshipType(relationshipType);
    validateCareRelationshipStatus(status);
    validateAccessScope(accessScope);
    validateDateRange(startsAt, endsAt, 'care relationship');

    await this.assertPatientOrganizationMembership(patientId, organizationId);

    const relationship = await this.patientRepository.addCareRelationship({
      patientId,
      organizationId,
      relatedUserId,
      relationshipType,
      status,
      accessScope,
      startsAt,
      endsAt,
      createdBy: actorUserId,
    });

    await recordPatientAudit(this.auditService, {
      actorUserId,
      organizationId,
      patientId,
      action: 'patient.care_relationship.create',
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: {
        careRelationshipId: relationship.id,
        relatedUserId,
        relationshipType,
        accessScope,
      },
    });

    return relationship;
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
