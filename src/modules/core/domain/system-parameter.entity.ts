import type { CoreStatus, CoreValue } from './core-value';

export interface SystemParameter {
  id: string;
  key: string;
  value: CoreValue;
  description: string | null;
  status: CoreStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
