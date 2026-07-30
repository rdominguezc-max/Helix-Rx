import type { CoreStatus } from './core-value';

export interface SupportedLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  defaultLocale: string;
  status: CoreStatus;
}
