import type { CoreMetadata, CoreStatus } from './core-value';

export interface CatalogItem {
  id: string;
  catalog: string;
  code: string;
  label: string;
  locale: string;
  sortOrder: number;
  metadata: CoreMetadata;
  status: CoreStatus;
}
