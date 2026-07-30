import { Injectable } from '@nestjs/common';
import type { AuditLog } from '../domain/audit-log.entity';
import type { RecordAuditLogData } from '../domain/audit-log.repository';
import { RecordAuditEventUseCase } from './record-audit-event.use-case';

@Injectable()
export class AuditService {
  constructor(private readonly recordAuditEventUseCase: RecordAuditEventUseCase) {}

  async recordEvent(command: RecordAuditLogData): Promise<AuditLog> {
    return this.recordAuditEventUseCase.execute(command);
  }
}
