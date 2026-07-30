import { Module } from '@nestjs/common';
import { AuditService } from './application/audit.service';
import { RecordAuditEventUseCase } from './application/record-audit-event.use-case';
import { AUDIT_LOG_REPOSITORY } from './domain/audit-log.repository';
import { PostgresAuditLogRepository } from './infrastructure/postgres-audit-log.repository';

@Module({
  providers: [
    AuditService,
    RecordAuditEventUseCase,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PostgresAuditLogRepository,
    },
  ],
  exports: [AuditService, RecordAuditEventUseCase],
})
export class AuditModule {}
