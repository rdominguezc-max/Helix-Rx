import type { CoreStatus, CoreValue } from './core-value';

export interface OrganizationSetting {
  id: string;
  organizationId: string;
  key: string;
  value: CoreValue;
  description: string | null;
  status: CoreStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
