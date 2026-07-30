import type { AuditLog } from '../domain/audit-log.entity';

export function buildAuditLogFixture(
  overrides: Partial<AuditLog> = {},
): AuditLog {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    actorUserId: '22222222-2222-4222-8222-222222222222',
    organizationId: '33333333-3333-4333-8333-333333333333',
    action: 'users.create',
    resourceType: 'users',
    resourceId: '44444444-4444-4444-8444-444444444444',
    result: 'success',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}
