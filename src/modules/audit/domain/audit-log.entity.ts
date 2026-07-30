export type AuditResult = 'success' | 'failure' | 'denied';

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue };

export type AuditMetadata = Record<string, AuditMetadataValue>;

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  organizationId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  result: AuditResult;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: AuditMetadata;
  createdAt: Date;
}
