import type { CoreStatus } from './core-value';

export interface SupportedTimezone {
  id: string;
  name: string;
  countryCode: string | null;
  status: CoreStatus;
}
