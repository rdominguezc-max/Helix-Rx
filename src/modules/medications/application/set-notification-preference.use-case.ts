import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import type {
  NotificationChannel,
  NotificationPreferenceStatus,
  PatientNotificationPreference,
} from '../domain/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification.repository';
import { recordMedicationAudit } from './medication-audit';
import { validateUuid } from './medication.validation';
import {
  normalizeNotificationChannels,
  validatePreferenceStatus,
  validateReminderLeadMinutes,
} from './notification.validation';

export interface SetNotificationPreferenceCommand {
  patientId: string;
  organizationId: string;
  enabledChannels: NotificationChannel[];
  reminderLeadMinutes?: number;
  status?: NotificationPreferenceStatus;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class SetNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    command: SetNotificationPreferenceCommand,
  ): Promise<PatientNotificationPreference> {
    validateUuid(command.patientId, 'patientId');
    validateUuid(command.organizationId, 'organizationId');
    const enabledChannels = normalizeNotificationChannels(
      command.enabledChannels,
    );
    const reminderLeadMinutes = command.reminderLeadMinutes ?? 15;
    const status = command.status ?? 'active';
    validateReminderLeadMinutes(reminderLeadMinutes);
    validatePreferenceStatus(status);

    const preference = await this.repository.setPreference({
      patientId: command.patientId,
      organizationId: command.organizationId,
      enabledChannels,
      reminderLeadMinutes,
      status,
      updatedBy: command.actorUserId ?? null,
    });
    await recordMedicationAudit(this.auditService, {
      actorUserId: command.actorUserId,
      organizationId: command.organizationId,
      patientId: command.patientId,
      action: 'patient.notification.preference.update',
      resourceId: preference.id,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      metadata: { enabledChannels, reminderLeadMinutes, status },
    });
    return preference;
  }
}
